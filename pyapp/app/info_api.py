import logging
import os

import kubernetes
from fastapi import APIRouter, status

from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

running_in_kubernetes = os.path.exists("/var/run/secrets/kubernetes.io/serviceaccount/namespace")

router = APIRouter()


@router.get(
    "/info",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    response_description="Returns some app info",
    responses={
        500: {"description": "Internal server error"},
    },
)
async def get_info():
    """
    Get app info
    """
    info = {}
    info["Running in kubernetes"] = str(running_in_kubernetes)
    if running_in_kubernetes:
        try:
            with open("/var/run/secrets/kubernetes.io/serviceaccount/namespace") as f:
                namespace = f.read().strip()
        except Exception:
            namespace = "default"
        info["Namespace"] = namespace

        pod_name = os.environ.get("POD_NAME") or os.environ.get("HOSTNAME")
        info["Pod name"] = pod_name

        if pod_name and namespace:
            kubernetes.config.load_incluster_config()
            v1 = kubernetes.client.CoreV1Api()
            try:
                pod = v1.read_namespaced_pod(name=pod_name, namespace=namespace)
                # Get image name from the first container
                if pod.spec.containers:
                    image_name = pod.spec.containers[0].image
                    info["Pod image"] = image_name
                else:
                    logging.error("No pod.spec.containers found")
            except Exception as e:
                logging.error("Can't retrieve pod image name. Error %s", str(e))

    return info
