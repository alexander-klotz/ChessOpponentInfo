// In-page cache of the user's options
const options = {};
const optionsForm = document.getElementById("optionsForm");

document.getElementById('aren').addEventListener('change', function() {
  var checkboxes = ['arda', 'arra', 'arbl', 'arbu'];
  checkboxes.forEach(function(id) {
    document.getElementById(id).parentElement.style.display = this.checked ? '' : 'none';
  }, this);
});


// Immediately persist options changes
optionsForm.tgc.addEventListener("change", (event) => {
  options.tgc = event.target.checked;
  chrome.storage.sync.set({ options });
});

// Immediately persist options changes
optionsForm.aa.addEventListener("change", (event) => {
    options.aa = event.target.checked;
    chrome.storage.sync.set({ options });
});

// Immediately persist options changes
optionsForm.aw.addEventListener("change", (event) => {
    options.aw = event.target.checked;
    chrome.storage.sync.set({ options });
});

// Immediately persist options changes
optionsForm.avgN.addEventListener("change", (event) => {
  if(Number(event.target.value) < 1){
    return
  }
  if( Number(event.target.value) > 50){
    return
  }
  options.avgN = Number(event.target.value);
  chrome.storage.sync.set({ options });
});




// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);
optionsForm.tgc.checked = Boolean(options.tgc);
optionsForm.aa.checked = Boolean(options.aa);
optionsForm.aw.checked = Boolean(options.aw);
if (!options.avgN){
  optionsForm.avgN.value = 10
}else{
  optionsForm.avgN.value = Number(options.avgN);
}
