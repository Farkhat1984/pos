/**
 * Barcode Scanner using device camera
 * Uses browser APIs for camera access and ZXing library for barcode detection
 */
const BarcodeScanner = (() => {
    let scanner = null;
    let videoElement = null;
    let isScanning = false;
    let scanCallback = null;

    /**
     * Initialize the barcode scanner
     * @returns {Promise<boolean>} - Success status
     */
    async function initScanner() {
        try {
            // Check if ZXing library is loaded
            if (typeof ZXing === 'undefined') {
                // Load ZXing library dynamically
                await loadZXingLibrary();
            }

            // Create the video element if it doesn't exist
            if (!videoElement) {
                videoElement = document.getElementById('camera-preview');
                if (!videoElement) {
                    console.error('Camera preview element not found');
                    return false;
                }
            }

            // Initialize ZXing scanner
            scanner = new ZXing.BrowserMultiFormatReader();

            console.log('Barcode scanner initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize barcode scanner:', error);
            return false;
        }
    }

    /**
     * Load ZXing library
     * @returns {Promise<void>}
     */
    function loadZXingLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/zxing-js/0.18.6/zxing.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ZXing library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Start scanning for barcodes
     * @param {Function} callback - Function to call when a barcode is detected
     */
    async function startScanning(callback) {
        if (isScanning) {
            stopScanning();
        }

        try {
            // Initialize scanner if needed
            if (!scanner) {
                const initialized = await initScanner();
                if (!initialized) {
                    showMessage('Не удалось инициализировать сканер штрих-кодов');
                    return;
                }
            }

            // Store callback
            scanCallback = callback;

            // Show camera container
            const cameraContainer = document.getElementById('camera-container');
            if (cameraContainer) {
                cameraContainer.classList.remove('hidden');
            }

            // Request camera access and start decoding
            isScanning = true;
            scanner.decodeFromVideoDevice(null, videoElement, (result, error) => {
                if (result && scanCallback) {
                    // Call callback with barcode
                    scanCallback(result.getText());

                    // Stop scanning after successful scan
                    stopScanning();
                }

                if (error && !(error instanceof ZXing.NotFoundException)) {
                    console.error('Scanning error:', error);
                }
            });

            // Setup close button
            const closeButton = document.getElementById('close-camera');
            if (closeButton) {
                closeButton.onclick = stopScanning;
            }

            showMessage('Наведите камеру на штрих-код');
        } catch (error) {
            console.error('Failed to start camera:', error);
            showMessage('Не удалось получить доступ к камере');
        }
    }

    /**
     * Stop scanning
     */
    function stopScanning() {
        if (!isScanning || !scanner) {
            return;
        }

        try {
            // Reset scanner
            scanner.reset();
            isScanning = false;

            // Hide camera container
            const cameraContainer = document.getElementById('camera-container');
            if (cameraContainer) {
                cameraContainer.classList.add('hidden');
            }

            console.log('Barcode scanning stopped');
        } catch (error) {
            console.error('Error stopping scanner:', error);
        }
    }

    /**
     * Check if device has a camera
     * @returns {Promise<boolean>} - True if camera is available
     */
    async function hasCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error checking camera:', error);
            return false;
        }
    }

    /**
     * Show a message to the user
     * @param {string} message - Message to show
     */
    function showMessage(message) {
        // Check if we have a snackbar element
        const snackbar = document.getElementById('snackbar');
        if (snackbar) {
            snackbar.textContent = message;
            snackbar.className = 'show';
            setTimeout(() => {
                snackbar.className = snackbar.className.replace('show', '');
            }, 3000);
        } else {
            console.log(message);
        }
    }

    // Public API
    return {
        initScanner,
        startScanning,
        stopScanning,
        hasCamera
    };
})();

// Initialize barcode scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with camera support
    const cameraPreview = document.getElementById('camera-preview');
    if (cameraPreview) {
        BarcodeScanner.initScanner().then(initialized => {
            if (initialized) {
                console.log('Barcode scanner ready');
            }
        });
    }
});