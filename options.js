// In-page cache of the user's options
const options = {};
const optionsForm = document.getElementById("optionsForm");

document.getElementById('aren').addEventListener('change', function() {
  var checkboxes = ['arda', 'arra', 'arbl', 'arbu'];
  checkboxes.forEach(function(id) {
    document.getElementById(id).parentElement.style.display = this.checked ? '' : 'none';
  }, this);
});

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);
optionsForm.tgc.checked = Boolean(options.tgc);
optionsForm.aa.checked = Boolean(options.aa);
optionsForm.aw.checked = Boolean(options.aw);
optionsForm.aren.checked = Boolean(options.aren);
optionsForm.arda.checked = Boolean(options.arda);
optionsForm.arra.checked = Boolean(options.arra);
optionsForm.arbl.checked = Boolean(options.arbl);
optionsForm.arbu.checked = Boolean(options.arbu);
if (!options.avgN){
  optionsForm.avgN.value = 10
  options.avgN = 10
  chrome.storage.sync.set({ options });
}else{
  optionsForm.avgN.value = Number(options.avgN);
}
if(!Boolean(options.aren)){
  var checkboxes = ['arda', 'arra', 'arbl', 'arbu'];
  checkboxes.forEach(function(id) {
    document.getElementById(id).parentElement.style.display = 'none';
  }, this);
}


// persist optionsForm to chrome storage
optionsForm.addEventListener("change", async (event) => {
  const target = event.target;
  const optionName = target.name;

  if (optionName === 'avgN') {
    if (Number(target.value) < 1 || Number(target.value) > 50) {
      return;
    }
    options[optionName] = Number(target.value);
  } else {
    options[optionName] = target.checked;
  }

  chrome.storage.sync.set({ options });
  let test = await chrome.storage.sync.get("options");
  console.log(test)
});