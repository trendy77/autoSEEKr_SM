
let clipWindowId;
let para = document.createElement("div");
let aa = document.createElement("a");
let ii = document.createElement("i");
para.setAttribute("class", "fixed-action-btn");
ii.setAttribute("class", "large material-icons");
aa.setAttribute("class", "btn-floating btn-large blue pulse");
aa.setAttribute("id", "theButton");
aa.appendChild(ii);
para.appendChild(aa);
var element = document.getElementById("body");
element.appendChild(para);

document.getElementById("theButton").addEventListener("click",proField, false);

chrome.windows.getCurrent({ populate: true }, function(windowInfo) {
clipWindowId = windowInfo.id;
chrome.tabs.query({windowId: clipWindowId, active: true}, function (tabs) {
url = tabs[0].url;
console.log("clipjs says window ");
});

function proField(){
let fieldVale = window.getSelection.toString().trim();
chrome.runtime.sendMessage({type:'setNextField','fieldVal':fieldVale});
}

let nextField = progress + 1;
let tool = document.createElement("seekset");
tool.setAttribute("class", "btn tooltipped");
tool.setAttribute("data-position", "bottom");
tool.setAttribute("data-tooltip", nextField);
document.body.appendChild(tool);

document.addEventListener('DOMContentLoaded', function () {
var elems = document.querySelectorAll('.tooltipped');
var instances = M.Tooltip.init(elems, options);
//document.querySelector("#").addEventListener('click', proField);
});
