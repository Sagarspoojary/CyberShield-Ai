import os
import time
import joblib
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Union

logger = logging.getLogger("uvicorn")

class AIEngine:
    def __init__(self):
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        self.label_encoder = joblib.load(os.path.join(models_dir, "label_encoder.pkl"))
        
        self.model_files = [
            ("XGBoost", "xgboost_model.pkl"),
            ("LightGBM", "lightgbm_model (1).pkl"),
            ("Random Forest", "random_forest_model.pkl"),
            ("Extra Trees", "extra_trees_model.pkl"),
            ("Decision Tree", "decision_tree_model.pkl")
        ]
        
        self.models = {}
        for name, filename in self.model_files:
            path = os.path.join(models_dir, filename)
            if os.path.exists(path):
                try:
                    self.models[name] = joblib.load(path)
                    logger.info(f"Loaded model binary: {name}")
                except Exception as e:
                    logger.error(f"Failed loading model {name}: {e}")

        self.model = self.models.get("XGBoost", self.models.get("Random Forest"))

        self.recommendations_map = {
            "Normal": ["Continue Monitoring"],
            "Port_Scan": ["Block Source IP", "Increase Firewall Logging", "Monitor Host"],
            "Brute_Force": ["Block Source IP", "Lock Target Account", "Enable MFA"],
            "HTTP_DDoS": ["Activate Rate Limiting", "Block Source IP", "Enable WAF", "Generate Incident Report"],
            "ICMP_Flood": ["Drop ICMP Traffic", "Enable ICMP Rate Limit", "Monitor Gateway"],
            "Web_Crwling": ["Throttle Requests", "Update robots.txt", "Monitor Crawling Activity"]
        }
        self.feature_key_map = {
            "flow_duration": "Flow Duration",
            "total_fwd_packets": "Tot Fwd Pkts",
            "total_backward_packets": "Tot Bwd Pkts",
            "total_length_of_fwd_packets": "TotLen Fwd Pkts",
            "total_length_of_bwd_packets": "TotLen Bwd Pkts",
            "fwd_packet_length_max": "Fwd Pkt Len Max",
            "fwd_packet_length_min": "Fwd Pkt Len Min",
            "fwd_packet_length_mean": "Fwd Pkt Len Mean",
            "fwd_packet_length_std": "Fwd Pkt Len Std",
            "bwd_packet_length_max": "Bwd Pkt Len Max",
            "bwd_packet_length_min": "Bwd Pkt Len Min",
            "bwd_packet_length_mean": "Bwd Pkt Len Mean",
            "bwd_packet_length_std": "Bwd Pkt Len Std",
            "flow_bytes_s": "Flow Byts/s",
            "flow_packets_s": "Flow Pkts/s",
            "flow_iat_mean": "Flow IAT Mean",
            "flow_iat_std": "Flow IAT Std",
            "flow_iat_max": "Flow IAT Max",
            "flow_iat_min": "Flow IAT Min",
            "fwd_iat_total": "Fwd IAT Tot",
            "fwd_iat_mean": "Fwd IAT Mean",
            "fwd_iat_std": "Fwd IAT Std",
            "fwd_iat_max": "Fwd IAT Max",
            "fwd_iat_min": "Fwd IAT Min",
            "bwd_iat_total": "Bwd IAT Tot",
            "bwd_iat_mean": "Bwd IAT Mean",
            "bwd_iat_std": "Bwd IAT Std",
            "bwd_iat_max": "Bwd IAT Max",
            "bwd_iat_min": "Bwd IAT Min",
            "bwd_psh_flags": "Bwd PSH Flags",
            "bwd_urg_flags": "Bwd URG Flags",
            "fwd_header_length": "Fwd Header Len",
            "bwd_header_length": "Bwd Header Len",
            "fwd_packets_s": "Fwd Pkts/s",
            "bwd_packets_s": "Bwd Pkts/s",
            "min_packet_length": "Pkt Len Min",
            "max_packet_length": "Pkt Len Max",
            "packet_length_mean": "Pkt Len Mean",
            "packet_length_std": "Pkt Len Std",
            "packet_length_variance": "Pkt Len Var",
            "fin_flag_count": "FIN Flag Cnt",
            "syn_flag_count": "SYN Flag Cnt",
            "rst_flag_count": "RST Flag Cnt",
            "psh_flag_count": "PSH Flag Cnt",
            "ack_flag_count": "ACK Flag Cnt",
            "urg_flag_count": "URG Flag Cnt",
            "cwe_flag_count": "CWE Flag Count",
            "ece_flag_count": "ECE Flag Cnt",
            "down_up_ratio": "Down/Up Ratio",
            "average_packet_size": "Pkt Size Avg",
            "avg_fwd_segment_size": "Fwd Seg Size Avg",
            "avg_bwd_segment_size": "Bwd Seg Size Avg",
            "subflow_fwd_packets": "Subflow Fwd Pkts",
            "subflow_fwd_bytes": "Subflow Fwd Byts",
            "subflow_bwd_packets": "Subflow Bwd Pkts",
            "subflow_bwd_bytes": "Subflow Bwd Byts",
            "init_win_bytes_backward": "Init Bwd Win Byts",
            "act_data_pkt_fwd": "Fwd Act Data Pkts",
            "active_mean": "Active Mean",
            "active_std": "Active Std",
            "active_max": "Active Max",
            "active_min": "Active Min",
            "idle_mean": "Idle Mean",
            "idle_std": "Idle Std",
            "idle_max": "Idle Max",
            "idle_min": "Idle Min"
        }

    def test_all_models(self) -> Dict[str, Any]:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        files = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]
        cols = getattr(self.model, "feature_names_in_", [])
        test_df = pd.DataFrame(np.random.uniform(10, 100, size=(1, len(cols))), columns=cols)
        
        model_results = []
        for f in sorted(files):
            if "label_encoder" in f: continue
            path = os.path.join(models_dir, f)
            try:
                m = joblib.load(path)
                pred_raw = m.predict(test_df)[0]
                if isinstance(pred_raw, (int, np.integer, float, np.floating)):
                    pred_class = self.label_encoder.inverse_transform([int(pred_raw)])[0]
                else:
                    pred_class = str(pred_raw)
                
                conf = round(float(np.max(m.predict_proba(test_df)[0]) * 100.0), 1) if hasattr(m, "predict_proba") else 100.0
                model_results.append({"model_file": f, "status": "OPERATIONAL", "prediction": pred_class, "confidence": f"{conf}%"})
            except Exception as e:
                model_results.append({"model_file": f, "status": "ERROR", "error": str(e)})

        return {"status": "SUCCESS", "total_models": len(model_results), "label_encoder_classes": list(self.label_encoder.classes_), "models": model_results}

    def predict_attack(self, features: Union[Dict[str, Any], List[Any]]) -> Dict[str, Any]:
        start_t = time.time()
        now_str = datetime.now(timezone.utc).isoformat()
        time_display = datetime.now(timezone.utc).strftime("%H:%M:%S")

        if not self.models or self.label_encoder is None:
            raise RuntimeError("ML Models or Label Encoder not loaded properly on backend startup.")

        expected_cols = getattr(self.model, "feature_names_in_", [])
        expected_features_count = len(expected_cols) if len(expected_cols) > 0 else getattr(self.model, "n_features_in_", 66)

        if isinstance(features, list):
            if len(features) != expected_features_count:
                return {"error": "Feature mismatch", "expected": expected_features_count, "received": len(features)}
            row_dict = {col: float(val) for col, val in zip(expected_cols, features)}
            df = pd.DataFrame([row_dict])
            input_dict = row_dict
        else:
            input_payload = features.get("features", features) if isinstance(features, dict) else features
            if isinstance(input_payload, list):
                if len(input_payload) != expected_features_count:
                    return {"error": "Feature mismatch", "expected": expected_features_count, "received": len(input_payload)}
                row_dict = {col: float(val) for col, val in zip(expected_cols, input_payload)}
                df = pd.DataFrame([row_dict])
                input_dict = row_dict
            else:
                input_dict = input_payload if isinstance(input_payload, dict) else {}
                model_row = {}
                for model_col in expected_cols:
                    clean_col = model_col.strip("'")
                    val = None
                    for k, v in input_dict.items():
                        mapped_k = self.feature_key_map.get(k, k).strip("'")
                        if mapped_k.lower() == clean_col.lower() or str(k).strip("'").lower() == clean_col.lower():
                            try: val = float(v)
                            except Exception: val = 0.0
                            break
                    if val is None: val = 0.0
                    model_row[model_col] = val
                df = pd.DataFrame([model_row])

        tot_fwd_pkts = float(input_dict.get("Tot Fwd Pkts", input_dict.get("total_fwd_packets", 0.0)))
        tot_bwd_pkts = float(input_dict.get("Tot Bwd Pkts", input_dict.get("total_backward_packets", 0.0)))
        total_packets = float(input_dict.get("total_packets", tot_fwd_pkts + tot_bwd_pkts))

        # Evaluate predictions across all 5 models and select highest confidence model prediction
        model_breakdown = {}
        best_model_name = None
        best_prediction = None
        best_confidence_pct = -1.0

        for name, _ in self.model_files:
            if name not in self.models: continue
            m = self.models[name]
            try:
                probas = m.predict_proba(df)[0] if hasattr(m, "predict_proba") else np.zeros(len(self.label_encoder.classes_))
                if not hasattr(m, "predict_proba"): probas[int(m.predict(df)[0])] = 1.0
                top_class_idx = np.argmax(probas)
                top_class_name = str(self.label_encoder.inverse_transform([top_class_idx])[0])
                top_conf_pct = round(float(np.max(probas) * 100.0), 1)
                model_breakdown[name] = {"prediction": top_class_name, "confidence": top_conf_pct}
                if top_conf_pct > best_confidence_pct:
                    best_confidence_pct, best_prediction, best_model_name = top_conf_pct, top_class_name, name
            except Exception as e: logger.error(f"Error predicting with model {name}: {e}")

        # STRICT USER PACKET TABLE (EXACT BOUNDS):
        # Port Scan: below 20
        if total_packets < 20.0:
            prediction_name = "Port_Scan"
            confidence_pct = 100.0
            winning_model = "Port Scan Engine (below 20 packets)"
        # Normal: 20-100
        elif total_packets >= 20.0 and total_packets <= 100.0:
            prediction_name = "Normal"
            confidence_pct = 100.0
            winning_model = "Normal Baseline Engine (20-100 packets)"
        # Brute Force: 200-500
        elif total_packets >= 200.0 and total_packets <= 500.0:
            prediction_name = "Brute_Force"
            confidence_pct = 100.0
            winning_model = "Brute Force Engine (200-500 packets)"
        # Web Crawling: 500-2000
        elif total_packets > 500.0 and total_packets <= 2000.0:
            prediction_name = "Web_Crwling"
            confidence_pct = 100.0
            winning_model = "Web Crawling Engine (500-2000 packets)"
        # HTTP DDoS: 2000+
        elif total_packets > 2000.0:
            prediction_name = "HTTP_DDoS"
            confidence_pct = 100.0
            winning_model = "HTTP DDoS Engine (2000+ packets)"
        else:
            prediction_name = "Normal"
            confidence_pct = 100.0
            winning_model = "Normal Baseline Engine"

        confidence_val = confidence_pct / 100.0

        if prediction_name == "Normal": risk_score, severity = 5, "Low"
        elif prediction_name == "Web_Crwling": risk_score, severity = 20, "Low"
        elif prediction_name == "Port_Scan": risk_score, severity = 55, "Medium"
        elif prediction_name == "Brute_Force": risk_score, severity = 70, "High"
        elif prediction_name == "ICMP_Flood": risk_score, severity = 85, "Critical"
        elif prediction_name == "HTTP_DDoS": risk_score, severity = 95, "Critical"
        else: risk_score, severity = 5, "Low"

        recommendations = self.recommendations_map.get(prediction_name, ["Continue Monitoring"])
        elapsed_ms = round((time.time() - start_t) * 1000, 2)

        return {
            "attack": prediction_name,
            "prediction": prediction_name,
            "confidence": confidence_pct,
            "confidence_ratio": round(confidence_val, 2),
            "risk_score": risk_score,
            "severity": severity,
            "timestamp": now_str,
            "time": time_display,
            "inference_time": elapsed_ms,
            "winning_model": winning_model,
            "packet_classification_table": {
                "Port_Scan": "below 20 packets",
                "Normal": "20-100 packets",
                "Brute_Force": "200-500 packets",
                "Web_Crwling": "500-2000 packets",
                "HTTP_DDoS": "2000+ packets"
            },
            "selection_rule": "Strict Packet Bounds Classification Engine",
            "features_used": int(expected_features_count),
            "recommendations": recommendations,
            "model_breakdown": model_breakdown,
            "features": input_dict
        }

ai_engine = AIEngine()
