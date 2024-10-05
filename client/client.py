import socketio
import mss
import base64
import time
import os
import logging

# Set up logging to display errors and important information
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Create a Socket.IO client, force WebSocket only (disable polling)
sio = socketio.Client(logger=True, engineio_logger=True, reconnection=True)

SERVER_URL = 'http://192.168.31.237:5000'
PC_NAME = os.getenv('COMPUTERNAME') or 'PC-1'

@sio.event
def connect():
    logging.info(f'Connected to server as {PC_NAME}')
    sio.emit('registerPC', {'pcName': PC_NAME})

@sio.event
def disconnect():
    logging.warning('Disconnected from server')

def capture_screenshot():
    try:
        with mss.mss() as sct:
            temp_dir = os.getenv('TEMP')
            screenshot_path = os.path.join(temp_dir, 'screenshot.png')

            # Capture the screenshot
            sct.shot(output=screenshot_path)
            logging.info(f'Screenshot saved temporarily to: {screenshot_path}')

            # Convert screenshot to base64
            with open(screenshot_path, 'rb') as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode('utf-8')

            os.remove(screenshot_path)
            logging.info('Temporary screenshot file removed')

            return img_base64
    except Exception as e:
        logging.error(f'Error capturing screenshot: {e}')
        return None

@sio.on('takeScreenshot')
def on_take_screenshot():
    logging.info('Screenshot request received from admin')
    img_base64 = capture_screenshot()
    if img_base64:
        sio.emit('sendScreenshot', img_base64)
        logging.info('Screenshot sent to server')

@sio.event
def connect_error(data):
    logging.error(f"Connection failed: {data}")

def main():
    while True:
        try:
            logging.debug('Attempting to connect to server...')
            sio.connect(SERVER_URL, wait_timeout=10, transports=['websocket'])
            sio.wait()
        except socketio.exceptions.ConnectionError as e:
            logging.error(f'Connection failed, retrying in 5 seconds... ({e})')
            time.sleep(5)
        except Exception as e:
            logging.error(f'Unexpected error: {e}')
            time.sleep(5)

if __name__ == '__main__':
    main()
