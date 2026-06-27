from fastapi import APIRouter, status
from typing import Dict, Any, List
from app.network.feature_service import network_feature_service

router = APIRouter(tags=["Network Telemetry"])

@router.get("/network/latest-features", status_code=status.HTTP_200_OK)
async def get_latest_network_features() -> Dict[str, Any]:
    """
    Retrieve the most recent MSCAD extracted feature vector.
    """
    return network_feature_service.get_latest_features()

@router.get("/network/flows", status_code=status.HTTP_200_OK)
async def get_active_network_flows() -> Dict[str, Any]:
    """
    Retrieve active and recently completed network flows.
    """
    return network_feature_service.get_flows_summary()

@router.get("/network/stats", status_code=status.HTTP_200_OK)
async def get_network_developer_stats() -> Dict[str, Any]:
    """
    Retrieve developer-only telemetry metrics for network feature extraction.
    """
    return network_feature_service.get_developer_stats()

@router.get("/network/verification", status_code=status.HTTP_200_OK)
async def get_attack_verification_stats() -> Dict[str, Any]:
    """
    Retrieve Attack Verification Mode metrics including completed flows, classified flows, and prediction latency.
    """
    return network_feature_service.get_verification_stats()

@router.get("/network/ai-debug", status_code=status.HTTP_200_OK)
async def get_ai_debug_stats() -> Dict[str, Any]:
    """
    Retrieve Live AI Debug Panel telemetry.
    """
    return network_feature_service.get_ai_debug_stats()

@router.get("/network/debug", status_code=status.HTTP_200_OK)
async def get_cicflowmeter_debug_stats() -> Dict[str, Any]:
    """
    Retrieve CICFlowMeter Verification Mode telemetry.
    """
    return network_feature_service.flow_builder.get_debug_stats()

@router.get("/capture/status", status_code=status.HTTP_200_OK)
async def get_packet_capture_status() -> Dict[str, Any]:
    """
    Retrieve Packet Capture Engine health status.
    """
    flows_completed = len(network_feature_service.flow_builder.completed_flows)
    return network_feature_service.capture_engine.get_capture_status(flows_completed)

@router.get("/pipeline/status", status_code=status.HTTP_200_OK)
async def get_realtime_pipeline_status() -> Dict[str, Any]:
    """
    Retrieve complete real-time network pipeline status and thread health.
    """
    return network_feature_service.get_pipeline_status()

@router.post("/pipeline/self-test", status_code=status.HTTP_200_OK)
async def run_pipeline_self_test() -> Dict[str, Any]:
    """
    Execute end-to-end self-test through all 10 stages of the network AI pipeline.
    """
    return network_feature_service.run_self_test()
