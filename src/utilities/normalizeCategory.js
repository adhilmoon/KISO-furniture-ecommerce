 const normalize=(name)=>{
    return name
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g,"")
    .replace(/[^a-z0-9]/g, '')

}

export default normalize