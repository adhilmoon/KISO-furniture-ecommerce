async function handle_AddproductPage(){
    
    const response=await axios.get('/admin/product/add');

    if(!response.success){
       showToast(response.message.error
       ||"somthin went rowng","error") 
    }
}