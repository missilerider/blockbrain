'use strict';

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

async function kk() {
  console.log("INI");
  return kk2();
}

async function kk2() {
  await sleep(1000);
  return "333";
}

async function main() {
  var proms = [ kk2() ];
  console.dir(proms);
  console.log("ESPERO");
  console.dir(await Promise.all(proms));

  console.log("FIN");
}

main();
