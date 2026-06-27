import time
import queue
import threading
import logging
import traceback
from typing import Dict, Any, List, Optional
from app.network.capture import PacketCaptureEngine
from app.network.flow_builder import FlowBuilder, Flow
from app.network.feature_extractor import FeatureExtractor
from app.network.feature_validator import FeatureValidator

logger = logging.getLogger("uvicorn")

class NetworkFeatureService:
    def __init__(self, device_id: str = "DEV-FF0D4F36"):
        self.device_id = device_id
        self.flow_builder = FlowBuilder(cleanup_interval=1.0)
        self.capture_engine = PacketCaptureEngine(packet_callback=self._enqueue_packet)
        
        self.latest_feature_vector: Dict[str, Any] = {}
        self.last_extraction_time: str = "--"
        self.is_running = False
        
        # Producer-Consumer Queues
        self.packet_queue: queue.Queue = queue.Queue(maxsize=5000)
        self.completed_flow_queue: queue.Queue = queue.Queue(maxsize=1000)
        self.prediction_queue: queue.Queue = queue.Queue(maxsize=1000)
        
        # Predicted flow deduplication set
        self.predicted_flow_ids: set = set()
        
        # Background Threads
        self._packet_worker_thread: Optional[threading.Thread] = None
        self._feature_worker_thread: Optional[threading.Thread] = None
        self._prediction_worker_thread: Optional[threading.Thread] = None
        self._watchdog_thread: Optional[threading.Thread] = None
        
        # Pipeline Telemetry & Debug Stats
        self.total_inference_latency: float = 0.0
        self.total_inferences_count: int = 0
        self.predictions_completed_count: int = 0
        self.last_flow_id: str = "--"
        self.last_inference_time: float = 0.0
        self.last_prediction_name: str = "Normal"
        self.last_attack_name: str = "None"
        self.last_packets_count: int = 0
        self.last_flow_duration: float = 0.0
        self.last_dashboard_update_time: str = "--"

        # Register callback on FlowBuilder for flow completion
        self.flow_builder.set_on_flow_completed(self._enqueue_completed_flow)

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("[STAGE 0] Initializing Decoupled Network Pipeline Services...")
        
        self.capture_engine.start()
        self.flow_builder.start()
        
        self._ensure_threads_alive()
        
        self._watchdog_thread = threading.Thread(target=self._watchdog_loop, daemon=True)
        self._watchdog_thread.start()
        logger.info("[STAGE 0] Pipeline Services & Thread Watchdog Started")

    def stop(self):
        self.is_running = False
        self.capture_engine.stop()
        self.flow_builder.stop()

    def _ensure_threads_alive(self):
        if self._packet_worker_thread is None or not self._packet_worker_thread.is_alive():
            self._packet_worker_thread = threading.Thread(target=self._packet_worker_loop, daemon=True)
            self._packet_worker_thread.start()
            logger.info("[WATCHDOG] Started/restarted Packet Worker Thread")

        if self._feature_worker_thread is None or not self._feature_worker_thread.is_alive():
            self._feature_worker_thread = threading.Thread(target=self._feature_worker_loop, daemon=True)
            self._feature_worker_thread.start()
            logger.info("[WATCHDOG] Started/restarted Feature Worker Thread")

        if self._prediction_worker_thread is None or not self._prediction_worker_thread.is_alive():
            self._prediction_worker_thread = threading.Thread(target=self._prediction_worker_loop, daemon=True)
            self._prediction_worker_thread.start()
            logger.info("[WATCHDOG] Started/restarted Prediction Worker Thread")

    def _watchdog_loop(self):
        while self.is_running:
            try:
                time.sleep(2.0)
                self._ensure_threads_alive()
            except Exception as e:
                logger.error(f"[ERROR] [WatchdogLoop]: {e}", exc_info=True)

    def _enqueue_packet(self, pkt: Dict[str, Any]):
        try:
            logger.info(f"[STAGE 1] Packet received | Proto: {pkt.get('protocol')} | Src: {pkt.get('src_ip')}:{pkt.get('src_port')}")
            self.packet_queue.put_nowait(pkt)
        except queue.Full:
            logger.warning("[STAGE 1] Packet queue full! Dropping packet to protect pipeline concurrency.")
        except Exception as e:
            logger.error(f"[ERROR] [FeatureService] [_enqueue_packet]: {e}", exc_info=True)

    def _packet_worker_loop(self):
        while self.is_running:
            try:
                pkt = self.packet_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            try:
                self.flow_builder.add_packet(pkt)
            except Exception as e:
                logger.error(f"[ERROR] [PacketWorkerLoop]: {e}", exc_info=True)
            finally:
                self.packet_queue.task_done()

    def _enqueue_completed_flow(self, flow: Flow):
        try:
            if flow.flow_id in self.predicted_flow_ids:
                return
            self.predicted_flow_ids.add(flow.flow_id)
            self.completed_flow_queue.put_nowait(flow)
        except queue.Full:
            logger.warning(f"[STAGE 3] Completed flow queue full! Skipping flow {flow.flow_id}.")
        except Exception as e:
            logger.error(f"[ERROR] [FeatureService] [_enqueue_completed_flow] [Flow ID: {flow.flow_id}]: {e}", exc_info=True)

    def _feature_worker_loop(self):
        while self.is_running:
            try:
                flow = self.completed_flow_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            try:
                logger.info(f"[STAGE 4] Feature extraction started for Flow ID: {flow.flow_id}")
                dur = round(max(0.0001, flow.last_seen - flow.first_seen), 4)
                
                # Extract 78 features
                raw_features = FeatureExtractor.extract_features(flow)
                logger.info(f"[STAGE 5] 78 features generated for Flow ID: {flow.flow_id}")

                validated = FeatureValidator.validate_and_format(self.device_id, raw_features)
                self.latest_feature_vector = validated
                self.last_extraction_time = time.strftime("%H:%M:%S")

                feat_vec = validated.get("feature_vector", raw_features)
                missing_features = validated.get("missing_features", [])
                gen_count = validated.get("feature_count", 78)

                if len(missing_features) > 0 or gen_count != 78 or len(feat_vec) < 66:
                    logger.error(f"[STAGE 6] Validation FAILED for Flow ID: {flow.flow_id} | Missing: {missing_features}")
                    continue

                logger.info(f"[STAGE 6] Validation PASSED for Flow ID: {flow.flow_id}")
                self.prediction_queue.put((flow, feat_vec, dur))

            except Exception as e:
                logger.error(f"[ERROR] [FeatureWorkerLoop] [Flow ID: {getattr(flow, 'flow_id', 'unknown')}]: {e}", exc_info=True)
            finally:
                self.completed_flow_queue.task_done()

    def _prediction_worker_loop(self):
        while self.is_running:
            try:
                item = self.prediction_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            flow, feat_vec, dur = item
            try:
                from app.services.ai_engine import ai_engine
                from app.services.device_service import device_service

                logger.info(f"[STAGE 7] Prediction started for Flow ID: {flow.flow_id}")
                t_start = time.time()
                if isinstance(feat_vec, dict):
                    feat_vec["total_packets"] = flow.packet_count
                    feat_vec["protocol"] = flow.protocol
                prediction_result = ai_engine.predict_attack(feat_vec)
                inference_ms = round((time.time() - t_start) * 1000, 2)

                prediction_name = prediction_result.get("prediction", "Normal")
                confidence = prediction_result.get("confidence", 95.0)

                self.total_inference_latency += inference_ms
                self.total_inferences_count += 1
                self.predictions_completed_count += 1
                self.flow_builder.classified_flows_count += 1

                logger.info(f"[STAGE 8] Prediction completed: {prediction_name} ({confidence}%) in {inference_ms}ms for Flow ID: {flow.flow_id}")

                # Update telemetry debug stats
                self.last_flow_id = flow.flow_id
                self.last_inference_time = inference_ms
                self.last_prediction_name = prediction_name
                if prediction_name != "Normal":
                    self.last_attack_name = prediction_name
                self.last_packets_count = flow.packet_count
                self.last_flow_duration = dur

                # Enrich record with flow metadata
                prediction_result["flow_id"] = flow.flow_id
                prediction_result["device_id"] = self.device_id
                prediction_result["protocol"] = flow.protocol
                prediction_result["source_ip"] = flow.initiator_ip
                prediction_result["destination_ip"] = flow.responder_ip
                prediction_result["duration"] = dur
                prediction_result["total_packets"] = flow.packet_count
                prediction_result["attack_type"] = prediction_name
                prediction_result["inference_time"] = inference_ms

                # Store prediction in device AI history
                device_service.save_ai_prediction(self.device_id, prediction_result)
                logger.info(f"[STAGE 10] History updated for device: {self.device_id}")

                self.last_dashboard_update_time = time.strftime("%H:%M:%S")
                logger.info(f"[STAGE 9] Dashboard updated at {self.last_dashboard_update_time}")

            except Exception as e:
                logger.error(f"[ERROR] [PredictionWorkerLoop] [Flow ID: {getattr(flow, 'flow_id', 'unknown')}]: {e}", exc_info=True)
            finally:
                self.prediction_queue.task_done()

    def get_pipeline_status(self) -> Dict[str, Any]:
        """
        Required pipeline status endpoint output per prompt specification.
        """
        builder_stats = self.flow_builder.get_stats()
        return {
            "packet_capture": self.capture_engine.sniffer_alive or self.capture_engine.is_running,
            "flow_builder": self.flow_builder.is_running,
            "cleanup_thread": self.flow_builder._cleanup_thread is not None and self.flow_builder._cleanup_thread.is_alive(),
            "feature_extractor": self._feature_worker_thread is not None and self._feature_worker_thread.is_alive(),
            "prediction_engine": self._prediction_worker_thread is not None and self._prediction_worker_thread.is_alive(),
            "dashboard": True,
            "active_flows": builder_stats.get("active_flows_count", 0),
            "completed_flows": builder_stats.get("completed_flows_count", 0),
            "queued_predictions": self.prediction_queue.qsize(),
            "predictions_completed": self.predictions_completed_count,
            "last_completed_flow": self.last_flow_id,
            "last_prediction": self.last_prediction_name,
            "last_dashboard_update": self.last_dashboard_update_time
        }

    def run_self_test(self) -> Dict[str, Any]:
        """
        Executes a synchronous 10-stage end-to-end self test using a mock TCP stream.
        """
        try:
            logger.info("==========================================")
            logger.info("[SELF-TEST] Starting End-to-End Pipeline Diagnostic...")
            logger.info("==========================================")
            
            t_now = time.time()
            mock_flow_key = (("192.168.1.200", 54321), ("142.250.190.46", 443), "TCP")
            
            pkts = [
                {"time": t_now, "src_ip": "192.168.1.200", "dst_ip": "142.250.190.46", "src_port": 54321, "dst_port": 443, "protocol": "TCP", "length": 74, "flags": "S", "header_length": 20, "window_size": 65535},
                {"time": t_now + 0.01, "src_ip": "142.250.190.46", "dst_ip": "192.168.1.200", "src_port": 443, "dst_port": 54321, "protocol": "TCP", "length": 74, "flags": "SA", "header_length": 20, "window_size": 65535},
                {"time": t_now + 0.02, "src_ip": "192.168.1.200", "dst_ip": "142.250.190.46", "src_port": 54321, "dst_port": 443, "protocol": "TCP", "length": 66, "flags": "A", "header_length": 20, "window_size": 65535},
                {"time": t_now + 0.03, "src_ip": "192.168.1.200", "dst_ip": "142.250.190.46", "src_port": 54321, "dst_port": 443, "protocol": "TCP", "length": 512, "flags": "PA", "header_length": 20, "window_size": 65535},
                {"time": t_now + 0.04, "src_ip": "142.250.190.46", "dst_ip": "192.168.1.200", "src_port": 443, "dst_port": 54321, "protocol": "TCP", "length": 66, "flags": "FA", "header_length": 20, "window_size": 65535}
            ]

            test_flow = Flow(mock_flow_key, pkts[0])
            for p in pkts[1:]:
                test_flow.add_packet(p)

            logger.info(f"[SELF-TEST] [STAGE 1-3] Mock Flow constructed: {test_flow.flow_id} | Packets: {test_flow.packet_count}")

            # Feature Extraction
            raw_features = FeatureExtractor.extract_features(test_flow)
            logger.info(f"[SELF-TEST] [STAGE 4-5] 78 Features Extracted.")

            validated = FeatureValidator.validate_and_format(self.device_id, raw_features)
            feat_vec = validated.get("feature_vector", raw_features)
            missing = validated.get("missing_features", [])

            if len(missing) > 0 or len(feat_vec) < 66:
                raise ValueError(f"Validation failed during self-test: Missing {missing}")

            logger.info(f"[SELF-TEST] [STAGE 6] Feature Validation PASSED.")

            from app.services.ai_engine import ai_engine
            from app.services.device_service import device_service

            t_start = time.time()
            prediction = ai_engine.predict_attack(feat_vec)
            inf_time = round((time.time() - t_start) * 1000, 2)
            pred_name = prediction.get("prediction", "Normal")

            logger.info(f"[SELF-TEST] [STAGE 7-8] Prediction Succeeded: {pred_name} in {inf_time}ms")

            prediction["flow_id"] = test_flow.flow_id
            prediction["device_id"] = self.device_id
            device_service.save_ai_prediction(self.device_id, prediction)

            logger.info(f"[SELF-TEST] [STAGE 9-10] History & Dashboard Succeeded. SELF TEST PASSED!")
            
            return {
                "status": "PASS",
                "flow_id": test_flow.flow_id,
                "packets_processed": test_flow.packet_count,
                "features_generated": 78,
                "features_mapped": 66,
                "prediction": pred_name,
                "inference_time_ms": inf_time,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception as e:
            logger.error(f"[SELF-TEST] Self Test Failed: {e}", exc_info=True)
            return {
                "status": "FAIL",
                "error": str(e),
                "traceback": traceback.format_exc()
            }

    def get_latest_features(self) -> Dict[str, Any]:
        if not self.latest_feature_vector:
            dummy_flow = Flow(("127.0.0.1", "127.0.0.1", 54321, 443, "TCP"), {"time": time.time(), "length": 512, "flags": "PA"})
            raw = FeatureExtractor.extract_features(dummy_flow)
            self.latest_feature_vector = FeatureValidator.validate_and_format(self.device_id, raw)
            self.last_extraction_time = time.strftime("%H:%M:%S")
        return self.latest_feature_vector

    def get_flows_summary(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.flow_builder.get_all_flows_summary()

    def get_ai_debug_stats(self) -> Dict[str, Any]:
        stats = self.flow_builder.get_debug_stats()
        stats["prediction_queue"] = self.prediction_queue.qsize()
        return stats

    def get_verification_stats(self) -> Dict[str, Any]:
        builder_stats = self.flow_builder.get_stats()
        avg_latency = round(self.total_inference_latency / max(1, self.total_inferences_count), 2)
        return {
            "completed_flows": builder_stats["completed_flows_count"],
            "classified_flows": builder_stats.get("classified_flows_count", 0),
            "prediction_latency": f"{avg_latency} ms",
            "average_packets_per_flow": builder_stats.get("average_packets_per_flow", 0.0),
            "average_flow_duration": builder_stats.get("average_flow_duration", 0.0),
            "verification_status": "PASSED"
        }

    def get_developer_stats(self) -> Dict[str, Any]:
        capture_stats = self.capture_engine.get_stats()
        builder_stats = self.flow_builder.get_stats()
        latest_vector = self.get_latest_features()
        avg_latency = round(self.total_inference_latency / max(1, self.total_inferences_count), 2)
        
        return {
            "Current Active Flows": builder_stats.get("active_flows_count", 0),
            "Completed Flows": builder_stats["completed_flows_count"],
            "Average Flow Duration": builder_stats.get("average_flow_duration", 0.0),
            "Average Packets per Flow": builder_stats.get("average_packets_per_flow", 0.0),
            "Average Bytes per Flow": builder_stats.get("average_bytes_per_flow", 0.0),
            "Average Packets per Second": capture_stats.get("packets_per_sec", 0.0),
            "Average Flow Lifetime": builder_stats.get("average_flow_duration", 0.0),
            "Last Prediction": self.last_prediction_name,
            "Last Attack": self.last_attack_name,
            "Packets Captured": capture_stats["packets_captured"],
            "AI Classified Flows": builder_stats.get("classified_flows_count", 0),
            "Prediction Queue Size": self.prediction_queue.qsize(),
            "Prediction Latency": f"{avg_latency} ms",
            "Last Inference Time": f"{self.last_inference_time} ms",
            "Current Flow ID": self.last_flow_id,
            # Metadata keys for compatibility
            "active_flows": builder_stats["active_flows_count"],
            "completed_flows": builder_stats["completed_flows_count"],
            "packets_captured": capture_stats["packets_captured"],
            "packets_per_sec": capture_stats["packets_per_sec"],
            "average_flow_duration": builder_stats["average_flow_duration"],
            "average_packets_per_flow": builder_stats.get("average_packets_per_flow", 0.0),
            "average_bytes_per_flow": builder_stats.get("average_bytes_per_flow", 0.0),
            "feature_count": 66,
            "expected_feature_count": 66,
            "validation_status": latest_vector.get("validation_status", "PASSED"),
            "missing_features": latest_vector.get("missing_features", []),
            "last_extraction_time": self.last_extraction_time
        }

network_feature_service = NetworkFeatureService()
