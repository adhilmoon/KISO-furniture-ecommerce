//debounce macanisam

 export const debounce=(func,delay=500)=>{
    let timer;
    return function(...args){
        clearTimeout(timer);

        timer=setTimeout(()=>{
            func.apply(this,args);
        },delay)
    }
}

