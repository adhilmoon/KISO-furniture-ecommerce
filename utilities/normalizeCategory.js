 const normalize=(name)=>{
    name
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g,"")
    .replace(/[^a-z0-9]/g, '')

}

export default normalize