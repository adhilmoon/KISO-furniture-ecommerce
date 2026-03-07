window.confirmAction=function(message = "Are you sure?"){
    return Swal.fire({
        title: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        reverseButtons: true
    });
}