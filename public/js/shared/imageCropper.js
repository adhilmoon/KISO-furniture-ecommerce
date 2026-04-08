

let cropperInstance = null;

window.ImageCropper = (function () {

    function createModal() {
        if (document.getElementById('cropperModal')) return;

        const modal = document.createElement('div');
        modal.id = 'cropperModal';
        modal.style.cssText = `
            display:none; position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,0.75); align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="background:#111; border-radius:12px; padding:24px; width:min(600px,95vw); display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p style="color:#f8f9fa; font-weight:500; font-size:15px; margin:0;">Crop Image</p>
                    <button id="cropperCloseBtn" style="background:none; border:none; color:#a3a3a3; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
                </div>
                <div style="position:relative; max-height:400px; overflow:hidden; background:#000; border-radius:8px;">
                    <img id="cropperImage" style="display:block; max-width:100%;">
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                    <button class="cropper-action-btn" data-action="rotate-left" title="Rotate Left"
                        style="padding:8px 12px; background:#1e1e1e; border:1px solid #333; color:#d4af37; border-radius:8px; cursor:pointer; font-size:13px;">↺ Rotate</button>
                    <button class="cropper-action-btn" data-action="rotate-right" title="Rotate Right"
                        style="padding:8px 12px; background:#1e1e1e; border:1px solid #333; color:#d4af37; border-radius:8px; cursor:pointer; font-size:13px;">↻ Rotate</button>
                    <button class="cropper-action-btn" data-action="zoom-in" title="Zoom In"
                        style="padding:8px 12px; background:#1e1e1e; border:1px solid #333; color:#d4af37; border-radius:8px; cursor:pointer; font-size:13px;">+ Zoom</button>
                    <button class="cropper-action-btn" data-action="zoom-out" title="Zoom Out"
                        style="padding:8px 12px; background:#1e1e1e; border:1px solid #333; color:#d4af37; border-radius:8px; cursor:pointer; font-size:13px;">− Zoom</button>
                    <button class="cropper-action-btn" data-action="flip-h" title="Flip Horizontal"
                        style="padding:8px 12px; background:#1e1e1e; border:1px solid #333; color:#d4af37; border-radius:8px; cursor:pointer; font-size:13px;">⇄ Flip H</button>
                    <div style="margin-left:auto; display:flex; gap:8px;">
                        <button id="cropperCancelBtn"
                            style="padding:9px 20px; background:#1e1e1e; border:1px solid #333; color:#a3a3a3; border-radius:8px; cursor:pointer; font-size:13px;">Cancel</button>
                        <button id="cropperConfirmBtn"
                            style="padding:9px 20px; background:#d4af37; border:none; color:#0a0a0a; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">Crop & Use</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('cropperCloseBtn').onclick = closeModal;
        document.getElementById('cropperCancelBtn').onclick = closeModal;

        modal.querySelectorAll('.cropper-action-btn').forEach(btn => {
            btn.onclick = () => {
                if (!cropperInstance) return;
                const action = btn.dataset.action;
                if (action === 'rotate-left') cropperInstance.rotate(-90);
                if (action === 'rotate-right') cropperInstance.rotate(90);
                if (action === 'zoom-in') cropperInstance.zoom(0.1);
                if (action === 'zoom-out') cropperInstance.zoom(-0.1);
                if (action === 'flip-h') {
                    const cd = cropperInstance.getData();
                    cropperInstance.scaleX(cd.scaleX === -1 ? 1 : -1);
                }
            };
        });
    }

    function closeModal() {
        const modal = document.getElementById('cropperModal');
        if (modal) modal.style.display = 'none';
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    }

    function openCropper({ file, aspectRatio = 1, onCrop }) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Image must be under 10MB', 'error');
            return;
        }

        createModal();

        const reader = new FileReader();
        reader.onload = (e) => {
            const modal = document.getElementById('cropperModal');
            const img = document.getElementById('cropperImage');
            img.src = e.target.result;
            modal.style.display = 'flex';

            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }

            img.onload = () => {
                cropperInstance = new Cropper(img, {
                    aspectRatio: aspectRatio,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    responsive: true,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });
            };

            document.getElementById('cropperConfirmBtn').onclick = () => {
                if (!cropperInstance) return;
                cropperInstance.getCroppedCanvas({
                    maxWidth: 1200,
                    maxHeight: 1200,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                }).toBlob((blob) => {
                    closeModal();
                    if (onCrop) onCrop(blob, URL.createObjectURL(blob));
                }, 'image/jpeg', 0.92);
            };
        };
        reader.readAsDataURL(file);
    }

    return { openCropper };
})();