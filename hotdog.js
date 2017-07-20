makeHotDog() // (Promise) HotDog is made
  .then(serveHotDog) // THEN it is served (Adding this THEN is the same as adding another THEN after addSauce)
  // But to chain another THEN after serveHotDog, you'd need to make serveHotDog return a promise.

function makeHotDog () {
  return getBun() // getBun is a promise that RESOLVES when the bun had been retrieved
  .then(addSausage, /* can handle reject here*/) // THEN addSausage is a promise which you hand the bun that resolves back the bun + sausage when the sausage has been added.
  .then(addSauce, /* can handle reject here*/) // THEN addSauce is a promise which you hand the bun + sausage that resolves back the bun+sausage+sauce when the sauce has been added.
}

// This function does the same thing, but it's MUCH harder to read and understand
function makeHotDog_BAD() {
  return getBun()
    .then((bun) => {
      addSausage(bun)
        .then((bunWithSausage) => {
          addSauce(bunWithSausage)
        });
    });
}

// Here is an example of what one of those methods being called
function addSausage(bun) {
  return new Promise((resolve, reject) => {
    /* These are synchronous fucntions, don't worry much about what happens up here
       don't really matter, more about the resolve and reject */
    var sausage = PickupSausage();
    bun = PutSausageInBun(sausage, bun);

    // If sausage was success
    if(sausage in bun) {
      resolve(bun); // call bunWithSausage in BAD function
    } else {
      reject(bun); // Network errors should be rejected
    }
  });
}