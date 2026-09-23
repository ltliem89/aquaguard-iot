/**
 * PWA Install Button & Network Offline Indicator
 * Adheres to PWA integration guidelines:
 * - Detects standalone mode (auto-hides)
 * - Handles Chromium/Android beforeinstallprompt
 * - Provides iOS Safari guidance
 * - Notifies when network is offline
 */

let deferredInstallPrompt = null;

export function setupPWA() {
  const installBtn = document.getElementById('pwaInstallBtn');
  const offlineBanner = document.getElementById('offlineBanner');

  // Check standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone && installBtn) {
    installBtn.style.display = 'none';
  }

  // Detect iOS Safari
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn && !isStandalone) {
      installBtn.style.display = 'inline-flex';
      installBtn.innerHTML = '📥 Cài đặt PWA';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      } else if (isIOS) {
        alert('Cài đặt trên iPhone/iPad:\n1. Nhấn nút "Chia sẻ" (Share) trên thanh công cụ Safari.\n2. Cuộn xuống và chọn "Thêm vào MH chính" (Add to Home Screen).');
      } else {
        alert('Để cài đặt: Trên thanh địa chỉ trình duyệt, nhấn biểu tượng Cài đặt (Install) hoặc trong menu chọn "Cài đặt ứng dụng".');
      }
    });

    // If iOS and not standalone, show install button
    if (isIOS && !isStandalone) {
      installBtn.style.display = 'inline-flex';
      installBtn.innerHTML = '📲 Cài PWA (iOS)';
    }
  }

  // Network online/offline monitor
  const updateOnlineStatus = () => {
    if (offlineBanner) {
      if (!navigator.onLine) {
        offlineBanner.classList.add('active');
      } else {
        offlineBanner.classList.remove('active');
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}
