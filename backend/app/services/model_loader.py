import os
import logging
from typing import Tuple, Optional, Any

logger = logging.getLogger("uvicorn")

_model_cache: Optional[Any] = None
_label_encoder_cache: Optional[Any] = None

def load_ai_model() -> Tuple[Optional[Any], Optional[Any]]:
    """
    Loads random_forest_model.pkl and label_encoder.pkl from backend/app/models/.
    Returns (model, label_encoder). Logs 'Model Loaded' once during startup.
    """
    global _model_cache, _label_encoder_cache
    if _model_cache is not None and _label_encoder_cache is not None:
        return _model_cache, _label_encoder_cache

    base_dir = os.path.dirname(os.path.dirname(__file__))
    models_dir = os.path.join(base_dir, "models")
    
    model_path = os.path.join(models_dir, "random_forest_model.pkl")
    encoder_path = os.path.join(models_dir, "label_encoder.pkl")

    try:
        import joblib
        if os.path.exists(model_path) and os.path.exists(encoder_path):
            model = joblib.load(model_path)
            encoder = joblib.load(encoder_path)
            _model_cache = model
            _label_encoder_cache = encoder
            logger.info("Model Loaded")
            return model, encoder
        else:
            logger.error(f"ERROR loading ML models: Files missing in {models_dir}")
    except Exception as e:
        logger.error(f"ERROR loading ML models from {models_dir}: {e}")

    return None, None
