import math
from datetime import datetime, timezone
from typing import Dict, Any, List

# Canonical 78 MSCAD Dataset Feature Names in Exact Order
EXPECTED_MSCAD_FEATURES = [
    "destination_port", "flow_duration", "total_fwd_packets", "total_backward_packets",
    "total_length_of_fwd_packets", "total_length_of_bwd_packets", "fwd_packet_length_max",
    "fwd_packet_length_min", "fwd_packet_length_mean", "fwd_packet_length_std",
    "bwd_packet_length_max", "bwd_packet_length_min", "bwd_packet_length_mean",
    "bwd_packet_length_std", "flow_bytes_s", "flow_packets_s", "flow_iat_mean",
    "flow_iat_std", "flow_iat_max", "flow_iat_min", "fwd_iat_total",
    "fwd_iat_mean", "fwd_iat_std", "fwd_iat_max", "fwd_iat_min",
    "bwd_iat_total", "bwd_iat_mean", "bwd_iat_std", "bwd_iat_max",
    "bwd_iat_min", "fwd_psh_flags", "bwd_psh_flags", "fwd_urg_flags",
    "bwd_urg_flags", "fwd_header_length", "bwd_header_length", "fwd_packets_s",
    "bwd_packets_s", "min_packet_length", "max_packet_length", "packet_length_mean",
    "packet_length_std", "packet_length_variance", "fin_flag_count", "syn_flag_count",
    "rst_flag_count", "psh_flag_count", "ack_flag_count", "urg_flag_count",
    "cwe_flag_count", "ece_flag_count", "down_up_ratio", "average_packet_size",
    "avg_fwd_segment_size", "avg_bwd_segment_size", "fwd_header_length_1",
    "fwd_avg_bytes_bulk", "fwd_avg_packets_bulk", "fwd_avg_bulk_rate",
    "bwd_avg_bytes_bulk", "bwd_avg_packets_bulk", "bwd_avg_bulk_rate",
    "subflow_fwd_packets", "subflow_fwd_bytes", "subflow_bwd_packets",
    "subflow_bwd_bytes", "init_win_bytes_forward", "init_win_bytes_backward",
    "act_data_pkt_fwd", "min_seg_size_forward", "active_mean", "active_std",
    "active_max", "active_min", "idle_mean", "idle_std", "idle_max", "idle_min"
]

class FeatureValidator:
    @staticmethod
    def validate_and_format(device_id: str, raw_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates extracted feature dictionary against MSCAD schema requirements.
        """
        ordered_features = {}
        missing = []

        for key in EXPECTED_MSCAD_FEATURES:
            if key not in raw_features:
                missing.append(key)
                ordered_features[key] = 0.0
            else:
                val = raw_features[key]
                if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
                    ordered_features[key] = 0.0
                elif isinstance(val, float):
                    ordered_features[key] = round(val, 6)
                elif isinstance(val, int):
                    ordered_features[key] = int(val)
                else:
                    ordered_features[key] = val

        feature_count = len(ordered_features)
        expected_count = len(EXPECTED_MSCAD_FEATURES)
        status = "PASSED" if feature_count == expected_count and len(missing) == 0 else "FAILED"

        return {
            "device_id": device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feature_count": feature_count,
            "expected_feature_count": expected_count,
            "validation_status": status,
            "missing_features": missing,
            "feature_vector": ordered_features
        }
