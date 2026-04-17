
let existingVariantImageCount = {};
let attrCount = 0;
let variantCount = 0;
let cropper = null;

let imageQueue = [];
let croppedFiles = [];
let currentIndex = 0;
let currentInput = null;
let currentVariantId = null;

const variantCroppedFiles = {};
const $ = id => document.getElementById(id);

// ── Error helpers ─────────────────────────────────────────────────────────
function showError(id, msg) {
  const el = $(id);
  if(!el) return;
  el.textContent = msg || el.textContent;
  el.classList.remove('hidden');
}

function clearError(id) {
  const el = $(id);
  if(!el) return;
  el.classList.add('hidden');

}


function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.classList.add('hidden'));
  document.querySelectorAll('.field-invalid').forEach(e => e.classList.remove('field-invalid'));
  $('formErrorBanner')?.classList.add('hidden');
}

function showVariantError(variantId, field, msg) {
  const el = $(`verr-${variantId}-${field}`);
  if(el) {el.textContent = msg; el.classList.remove('hidden');}
  $(`vOptType-${variantId}`)?.classList[field === 'optType' ? 'add' : 'remove']('field-invalid');
}

function clearVariantError(variantId, field) {
  $(`verr-${variantId}-${field}`)?.classList.add('hidden');
  $(`v${field.charAt(0).toUpperCase() + field.slice(1)}-${variantId}`)?.classList.remove('field-invalid');
}

//____________________________Cropper open /close ______________________________________________________
function openCropper(file) {
  const img = $('cropImage');
  const url = URL.createObjectURL(file)
  img.src = url;

  $('cropeModal').style.display = 'flex';

  if(cropper) {cropper.destroy(); cropper = null}
  img.onload = () => {
    cropper = new Cropper(img, {
      aspectRatio: NaN,
      viewMode: 0,
      autoCropArea: 0.8,
      responsive: true,
      zoomable: true,
      scalable: true,
      cropBoxResizable: true,
      cropBoxMovable: true,
      minCropBoxWidth: 50,
      minCropBoxHeight: 50,
    });
  }
}
function closeCrop() {
  $('cropeModal').style.display = 'none';
  if(cropper) {cropper.destroy(); cropper = null}
  if(currentInput) currentInput.value = "";
}
//--Crop confirm-----------------------------------------

function confirmCrop() {

  if(!cropper) return;

  const canvas = cropper.getCroppedCanvas({width: 800, height: 800});


  canvas.toBlob((blob) => {
    if(!blob) return;

    const file = new File(
      [blob],
      `cropped-${Date.now()}-${currentIndex}.jpg`,
      {type: 'image/jpeg'}
    );
    croppedFiles.push(file);
    currentIndex++;

    if(currentIndex < imageQueue.length) {
      // More images in queue — crop next
      openCropper(imageQueue[currentIndex]);
    } else {

      if(currentVariantId !== null) {
        // Store for this variant
        if(!variantCroppedFiles[currentVariantId]) {variantCroppedFiles[currentVariantId] = [];}
        croppedFiles.forEach(f => {
          if(variantCroppedFiles[currentVariantId].length < 3) {
            variantCroppedFiles[currentVariantId].push(f);
          }
        });

        const dt = new DataTransfer();
        variantCroppedFiles[currentVariantId].forEach(f => dt.items.add(f));
        currentInput.files = dt.files;

        renderPreviews(variantCroppedFiles[currentVariantId], `vImgPreview-${currentVariantId}`, false);
      }

      closeCrop();
    }
  }, 'image/jpeg', 0.92);
}

//-------------image preview--------------------
function renderPreviews(files, containerId, large) {
  const container = $(containerId);
  if(!container) return;
  container.innerHTML = '';

  const size = 'w-16 h-16';

  Array.from(files).forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumb = document.createElement('div');
      thumb.className = `${size} rounded-xl border border-white/10 overflow-hidden bg-brand-bg2 shrink-0 relative group`;

      let overlayHtml = '';

      const variantId = containerId.split('-')[1];
      overlayHtml = `
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button type="button" onclick="viewImage('${e.target.result}')" title="View Image" class="p-1 text-white hover:text-brand-accent bg-black/50 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                        <button type="button" onclick="removeVariantImage('${variantId}', ${idx})" title="Remove" class="p-1 text-white hover:text-red-400 bg-black/50 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                `;


      thumb.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover">
                ${overlayHtml}
            `;
      container.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}



function removeVariantImage(variantId, idx) {
  if(variantCroppedFiles[variantId]) {
    variantCroppedFiles[variantId].splice(idx, 1);
    renderPreviews(variantCroppedFiles[variantId], `vImgPreview-${variantId}`, false);

    const dt = new DataTransfer();
    variantCroppedFiles[variantId].forEach(f => dt.items.add(f));
    const input = document.getElementById(`vImgInput-${variantId}`);
    if(input) input.files = dt.files;
  }
}

function viewImage(src) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 cursor-pointer';
  modal.innerHTML = `<img src="${src}" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl">`;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}


//__________variant image handler_________________________________


function handleVariantImages(input, variantId) {
  const files = Array.from(input.files);
  if(!files.length) return;
  const existingCount = existingVariantImageCount[variantId] || 0;
  
  const newCount = variantCroppedFiles[variantId]?.length || 0;
  const currentCount = variantCroppedFiles[variantId] ? variantCroppedFiles[variantId].length : 0;
  if(currentCount + files.length > 3) {
    input.value = '';
    showToast(`You can upload up to 3 images per variant. (Currently have ${currentCount})`, 'error');
    return;
  }
  currentInput = input;
  currentVariantId = variantId;
  imageQueue = files;
  croppedFiles = [];
  currentIndex = 0;

  openCropper(imageQueue[0]);
  input.value = '';
}

//______________Custom attributes___________________________________


function addCustomAttribute() {
  if (attrCount > 0) {
    const rows = document.querySelectorAll('#customAttributesContainer .attr-row');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const id  = lastRow.dataset.id;
      const key = $(`attr-key-${id}`)?.value.trim();
      const val = $(`attr-val-${id}`)?.value.trim();
      if (!key || !val) {
        showToast('Please fill in both name and value for the current attribute.', 'info');
        return;
      }
    }
  }

  attrCount++;
  const container = $('customAttributesContainer');
  const emptyEl   = $('customAttrEmpty');
  const headerRow = $('attrHeaderRow');

  emptyEl?.classList.add('hidden');
  headerRow?.classList.remove('hidden');

  const id  = attrCount;
  const row = document.createElement('div');
  row.dataset.id = id;
  row.className  = 'attr-row grid grid-cols-[1fr_1fr_auto] gap-3 items-start animate-slide-in';
  row.innerHTML  = `
    <div>
      <input type="text" id="attr-key-${id}" placeholder="Name  (e.g. Seat Height)"
        class="field-input w-full text-sm"
        oninput="document.getElementById('attr-err-${id}')?.classList.add('hidden');this.classList.remove('field-invalid')" />
    </div>
    <div>
      <input type="text" id="attr-val-${id}" placeholder="Value  (e.g. 45 cm)"
        class="field-input w-full text-sm"
        oninput="document.getElementById('attr-err-${id}')?.classList.add('hidden');this.classList.remove('field-invalid')" />
    </div>
    <button type="button" onclick="removeCustomAttribute(${id})"
      class="mt-2.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
    <p class="field-error col-span-3 hidden mt-1" id="attr-err-${id}"></p>
  `;
  container.appendChild(row);
}


function removeCustomAttribute(id) {
  document.querySelector(`[data-id="${id}"].attr-row`)?.remove();
  if(!$('customAttributesContainer').children.length) {
    $('customAttrEmpty')?.classList.remove('hidden');
    $('attrHeaderRow')?.classList.add('hidden');
  }
}
function collectCustomAttributes() {
  const result = [];
  document.querySelectorAll('#customAttributesContainer .attr-row').forEach(row => {
    const id = row.dataset.id;
    const key = $(`attr-key-${id}`)?.value.trim();
    const val = $(`attr-val-${id}`)?.value.trim();
    if(key) result.push({key, value: val || ''});
  });
  return result;
}
//_________________Variants_____________________________________________



function addVariant() {
   const container = $('variantsContainer');
  const existingCards = container.querySelectorAll('.variant-card');

  if (existingCards.length > 0) {
    const lastCard = existingCards[existingCards.length - 1];
    const lastId = lastCard.dataset.id;
    const optType  = $(`vOptType-${lastId}`)?.value.trim();
    const optValue = $(`vOptValue-${lastId}`)?.value.trim();   // ← was vOpValue (missing 't')
    const newImages    = variantCroppedFiles[lastId] || [];
    const existingCount = existingVariantImageCount[lastId] || 0;
    const totalImages  = newImages.length + existingCount;

    if (!optType || !optValue || totalImages === 0) {
      showToast("Please complete the current variant (Type, Value, and at least 1 image) before adding another.", "error");
      return;
    }
  }
  variantCount++;
  const vc = variantCount;
 
  $('variantEmpty').classList.add('hidden');


  const card = document.createElement('div');
  card.id = `variant-card-${vc}`;
  card.dataset.id = vc;
  card.className = 'variant-card bg-brand-bg2 border border-white/10 rounded-2xl overflow-hidden animate-slide-in';

  card.innerHTML = `
     <input type="hidden" id="vId-${vc}" value="" /> 
    <div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-bold flex items-center justify-center">${vc}</span>
        <span class="text-sm font-semibold text-kiso-text">Variant #${vc}</span>
      </div>
      <button type="button" onclick="removeVariant(${vc})"
        class="text-white/25 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <div class="p-5 flex flex-col gap-4">

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
            Option Type <span class="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <input type="text" id="vOptType-${vc}"
            placeholder="e.g. Size, Color, Finish"
            class="field-input w-full text-sm"
            oninput="clearVariantError(${vc},'optType')" />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button type="button" onclick="setOptType(${vc},'Size')"     class="chip">Size</button>
            <button type="button" onclick="setOptType(${vc},'Color')"    class="chip">Color</button>
            <button type="button" onclick="setOptType(${vc},'Material')" class="chip">Material</button>
            <button type="button" onclick="setOptType(${vc},'Finish')"   class="chip">Finish</button>
          </div>
          <p class="field-error hidden mt-1" id="verr-${vc}-optType"></p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
            Option Value <span class="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <input type="text" id="vOptValue-${vc}"
            placeholder="e.g. King, Navy, Oak"
            class="field-input w-full text-sm"
              oninput="clearVariantError(${vc},'optValue')" />
            <div id="vOptValueBtns-${vc}" class="flex flex-wrap gap-1.5 mt-2"></div>
          <p class="field-error hidden mt-1" id="verr-${vc}-optValue"></p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
            Price (₹) <span class="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm pointer-events-none">₹</span>
            <input type="number" id="vPrice-${vc}"
              placeholder="0.00" min="0" step="0.01"
              class="field-input w-full pl-7 text-sm"
              oninput="clearVariantError(${vc},'price')" />
          </div>
          <p class="field-error hidden mt-1" id="verr-${vc}-price"></p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
            Stock Qty <span class="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <input type="number" id="vStock-${vc}"
            placeholder="0" min="0"
            class="field-input w-full text-sm"
            oninput="clearVariantError(${vc},'stock')" />
          <p class="field-error hidden mt-1" id="verr-${vc}-stock"></p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
          Variant Images
          <span class="font-normal normal-case tracking-normal text-white/25 ml-1">Required — e.g. colour swatch photo</span>
        </label>
      <input 
      id="vImgInput-${vc}"
      type="file"
      accept="image/*" 
      multiple 
      class="hidden"
      onchange="handleVariantImages(this, '${vc}')"
/>
   <div id="vImgPreview-${vc}" class="flex flex-wrap gap-2 mt-2"></div>
        <label for="vImgInput-${vc}"
          class="flex items-center gap-3 border border-dashed border-white/10 hover:border-brand-accent/30 rounded-xl px-4 py-3 cursor-pointer transition group">
          <svg class="w-6 h-6 shrink-0 text-white/20 group-hover:text-brand-accent/40 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-xs text-brand-muted group-hover:text-brand-light transition">
            Click to upload<br/>
            <span class="text-white/25">JPG, PNG, WebP · Max 8 MB</span>
          </span>
        </label>
        <div id="vImgPreview-${vc}" class="flex flex-wrap gap-2 mt-2"></div>
      </div>

    </div>
  `;

  container.appendChild(card);
}
function removeVariant(id) {
  $(`variant-card-${id}`)?.remove();
  delete variantCroppedFiles[id];
  if(!$('variantsContainer').children.length) {
    $('variantEmpty').classList.remove('hidden');
  }
}
function setOptType(variantId, value) {
  const el = $(`vOptType-${variantId}`);
  if(el) {
    el.value = value;
    clearVariantError(variantId, 'optType');
  }
  renderValueButtons(variantId, value)

}
// variant tpe vlaue 
function renderValueButtons(variantId, type) {
  const container = $(`vOptValueBtns-${variantId}`)
  if(!container) return

  container.innerHTML = '';
  let values = [];
  switch(type) {
    case "Size":
      values = ["Single", "Double", "Queen", "King"];
      break;
    case "Color":
      values = ["Red", "Blue", "Black", "White"];
      break;
    case "Material":
      values = ["Wood", "Metal", "Plastic"];
      break;
    case "Finish":
      values = ["Matte", "Glossy", "Satin", "Textured"];
      break;
    default:
      values = [];
  }
  values.forEach(val => {
    const btn = document.createElement('button')
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = val;
    btn.onclick = () => {
      const input = $(`vOptValue-${variantId}`)
      if(input) input.value = val;
      clearVariantError(variantId, 'optValue')
    }
    container.appendChild(btn)
  })

}


function collectVariants() {
  const result = [];
  document.querySelectorAll('#variantsContainer .variant-card').forEach(card => {
    const id = card.dataset.id;
    result.push({
      optionType: $(`vOptType-${id}`)?.value.trim() || '',
      optionValue: $(`vOptValue-${id}`)?.value.trim() || '',
      price: parseFloat($(`vPrice-${id}`)?.value) || 0,
      stock: parseInt($(`vStock-${id}`)?.value, 10) || 0,
    });
  });
  return result;
}



//________________validation form_________________________________

function validateForm() {
  clearAllErrors();
  let valid = true
  const name = $('productName')?.value.trim();

  if(!name) {
    showError('err-productName', ' name is required');
    valid = false;
  } else if(name.length < 3) {
    showError('err-productName', 'Name must be at least 3 characters.');
    valid = false;
  }


  if(!$('category')?.value) {
    showError('err-category', 'Please select a category.');
    valid = false;
  }


  const bp = parseFloat($('basePrice')?.value);
  if(isNaN(bp) || bp < 0) {
    showError('err-basePrice', 'Enter a valid price (₹ 0 or more).');
    valid = false;
  }

  ['dimWidth', 'dimDepth', 'dimHeight'].forEach(id => {
    const v = $(id)?.value;
    if(v !== '' && v !== null && parseFloat(v) < 0) {
      showError(`err-${id}`, 'Value must be 0 or more.');
      valid = false;
    }
  });



  document.querySelectorAll('#customAttributesContainer .attr-row').forEach(row => {
    const id = row.dataset.id;
    const key = $(`attr-key-${id}`)?.value.trim();
    const val = $(`attr-val-${id}`)?.value.trim();
    const errEl = $(`attr-err-${id}`);

    if(!key && !val) {
      if(errEl) {errEl.textContent = 'Please enter key and vlue .'; errEl.classList.remove('hidden');}
      $(`attr-val-${id}`)?.classList.add('field-invalid');
      $(`attr-key-${id}`)?.classList.add('field-invalid');
      valid = false;
    } else if(key && !val) {

      if(errEl) {errEl.textContent = 'Please enter a value.'; errEl.classList.remove('hidden');}
      $(`attr-val-${id}`)?.classList.add('field-invalid');
      valid = false;
    } else if(!key && val) {
      if(errEl) {errEl.textContent = 'Please enter an attribute name.'; errEl.classList.remove('hidden');}
      $(`attr-key-${id}`)?.classList.add('field-invalid');
      valid = false;
    } else {
      if(errEl) errEl.classList.add('hidden');
      $(`attr-key-${id}`)?.classList.remove('field-invalid');
      $(`attr-val-${id}`)?.classList.remove('field-invalid');
    }
  });



  document.querySelectorAll('#variantsContainer .variant-card').forEach(card => {
    const id = card.dataset.id;
    const optType = $(`vOptType-${id}`)?.value.trim();
    const optValue = $(`vOptValue-${id}`)?.value.trim();
    const price = parseFloat($(`vPrice-${id}`)?.value);
    const stock = parseInt($(`vStock-${id}`)?.value, 10);

    if(!optType) {showVariantError(id, 'optType', 'Option type is required (e.g. Size, Color).'); valid = false;}
    else {clearVariantError(id, 'optType');}

    if(!optValue) {showVariantError(id, 'optValue', 'Option value is required (e.g. King, Navy).'); valid = false;}
    else {clearVariantError(id, 'optValue');}

    if(isNaN(price) || price < 0) {showVariantError(id, 'price', 'Enter a valid price (₹ 0 or more).'); valid = false;}
    else {clearVariantError(id, 'price');}

    if(isNaN(stock) || stock < 0) {showVariantError(id, 'stock', 'Enter a valid stock quantity (0 or more).'); valid = false;}
    else {clearVariantError(id, 'stock');}
  });

  if(!valid) {
    $('formErrorBanner').classList.remove('hidden');
    $('formErrorBanner').scrollIntoView({behavior: 'smooth', block: 'center'});
  }
  return valid;
}


// ── DOMContentLoaded ──────────────────────────────────────────────────────


document.addEventListener('DOMContentLoaded', () => {
  $('addProductForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    if(!validateForm()) return;

    const btn = $('saveProductBtn');
    const label = $('saveBtnLabel');
    const spinner = $('saveBtnSpinner');

    btn.disabled = true;
    label.textContent = 'Saving…';
    spinner.classList.remove('hidden');

    try {
      const fd = new FormData();
      console.log("fd in public/js/productAdd:", fd)
      // ---------------------Text fields--------------------
      fd.append('productName', $('productName').value.trim());
      fd.append('description', $('description').value.trim());
      fd.append('category', $('category').value);
      fd.append('basePrice', $('basePrice').value);
      fd.append('dimensions[width]', $('dimWidth').value || 0);
      fd.append('dimensions[depth]', $('dimDepth').value || 0);
      fd.append('dimensions[height]', $('dimHeight').value || 0);
      // Custom attributes and variants as JSON
      fd.append('customAttributesJSON', JSON.stringify(collectCustomAttributes()));
      fd.append('variantsJSON', JSON.stringify(collectVariants()));
      // main cropped image files-fieldname "images"


      // append variant images
      const variantsList = document.querySelectorAll('#variantsContainer .variant-card');
      variantsList.forEach((card, index) => {
        const id = card.dataset.id;
        const vFiles = variantCroppedFiles[id] || [];
        vFiles.forEach(f => {
          fd.append(`variants[${index}][images]`, f, f.name);
        });
      });

      const {data} = await axios.post('/admin/product/add', fd);
      if(data.success) {
        showToast('Product saved successfully!', 'success');
        setTimeout(() => window.location.href = '/admin/products', 1200);
      } else {
        showToast(data.message || 'Failed to save product.', 'error');
        btn.disabled = false;
        label.textContent = 'Save Product';
        spinner?.classList.add('hidden');
      }
    } catch(err) {
      const message = err.response?.data?.message || 'Network error. Please try again.';
      showToast(message, 'error');
      btn.disabled = false;
      label.textContent = 'Save Product';
      spinner?.classList.add('hidden');
    }
  });
});
