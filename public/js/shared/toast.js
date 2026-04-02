

window.showToast = function (message, type = 'info') {
   
    let container = document.getElementById('toast-container');

  
    if(!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    
    let bgColor, textColor, borderColor, iconHtml;

    switch(type) {
        case 'success':
            bgColor = 'bg-green-50';
            borderColor = 'border-green-200';
            textColor = 'text-green-800';
            iconHtml = `<svg class="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            break;
        case 'error':
            bgColor = 'bg-red-50';
            borderColor = 'border-red-200';
            textColor = 'text-red-800';
            iconHtml = `<svg class="w-4 h-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`;
            break;
        case 'warning':
            bgColor = 'bg-yellow-50';
            borderColor = 'border-yellow-200';
            textColor = 'text-yellow-800';
            iconHtml = `<svg class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            break;
        default: // info
            bgColor = 'bg-blue-50';
            borderColor = 'border-blue-200';
            textColor = 'text-blue-800';
            iconHtml = `<svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColor} ${borderColor} max-w-sm w-full`;

    toast.innerHTML = `
        ${iconHtml}
        <div class="flex-1 ${textColor} font-medium text-sm leading-relaxed">${message}</div>
        <button class="text-stone-400 hover:text-stone-600 focus:outline-none shrink-0" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    // Append to container
    container.appendChild(toast);

   
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    });


    setTimeout(() => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');


        setTimeout(() => {
            toast.remove();
        }, 300); 
    }, 3000);
};
document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const message = params.get("message");
    const error = params.get("error");

    if (message) {
        showToast(message, "success");
    }

    if (error) {
        showToast(error, "error");
    }

});