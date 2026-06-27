from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, status, Body, HTTPException
from app.schemas.ai import PredictResponse, AiHistoryResponse
from app.services.ai_engine import ai_engine
from app.services.device_service import device_service

router = APIRouter(tags=["AI Detection"])

@router.post("/predict", status_code=status.HTTP_200_OK)
async def predict_threat(
    body: Optional[Union[Dict[str, Any], List[Any]]] = Body(default=None)
):
    """
    Run machine learning prediction microservice on supplied MSCAD features or live features.
    Supports list feature arrays { "features": [66 floats...] } or feature dictionaries.
    """
    input_data = body if body is not None else {}
    device_id = "DEV-FF0D4F36"
    if isinstance(input_data, dict):
        device_id = input_data.get("device_id", "DEV-FF0D4F36")
    
    prediction_result = ai_engine.predict_attack(input_data)
    
    if "error" in prediction_result:
        return prediction_result

    device_service.save_ai_prediction(device_id, prediction_result)
    return prediction_result

@router.get("/ai/models/test", status_code=status.HTTP_200_OK)
async def test_all_trained_models():
    """
    Audit and verify all 5 machine learning models in app/models.
    """
    return ai_engine.test_all_models()

@router.get("/ai/predict/{device_id}")
async def get_latest_device_prediction(device_id: str):
    """
    Retrieve the latest recorded AI prediction for a given device_id.
    """
    return device_service.get_latest_ai_prediction(device_id)

@router.get("/ai/history/{device_id}", response_model=List[Dict[str, Any]])
async def get_device_ai_history(device_id: str):
    """
    Retrieve up to 50 latest historical AI incident predictions for a given device_id (newest first).
    """
    return device_service.get_ai_history(device_id)
