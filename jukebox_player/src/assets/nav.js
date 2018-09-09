
const remote = require('electron').remote; 
const settings = require('electron').remote.require('electron-settings');

var currentPage = "";

hideAllModals();

if(!settings.has('setup.isComplete')){
  showModal('setup');
} else {
  showModal('connect');
  
}
//if setup.isComplete is false go to setup modal


function hideAllModals () {
    const modals = document.querySelectorAll('.modal.is-shown')
    Array.prototype.forEach.call(modals, function (modal) {
      modal.classList.remove('is-shown')
    })
    currentPage = ""
}
function showModal (modalName) {
  console.log(modalName);
  const modal = document.getElementById(modalName + '-modal');
  modal.classList.add('is-shown');
  currentPage = modalName;
}
module.exports = {
  getCurrentPage: function() {
    return currentPage;
  },
  switchToPage: function(newPage) {
    hideAllModals();
    showModal(newPage);
    return true;
  }
}