import datetime
import logging
import os

import kubernetes
from fastapi import APIRouter, status
from kubernetes.client.models import V1Pod

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
    info["Running in Kubernetes"] = str(running_in_kubernetes)
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
                # Ensure pod is a V1Pod instance and has spec and containers
                if (
                    isinstance(pod, V1Pod)
                    and pod.spec is not None
                    and getattr(pod.spec, "containers", None) is not None
                    and isinstance(pod.spec.containers, list)
                    and len(pod.spec.containers) > 0
                ):
                    image_name = pod.spec.containers[0].image
                    info["Pod image"] = image_name
                else:
                    logging.error("Pod object is not a V1Pod instance or missing spec/containers")
            except Exception as e:
                logging.error("Can't retrieve pod image name. Error %s", str(e))

    info["Now"] = datetime.datetime.now().astimezone().isoformat()

    return info
