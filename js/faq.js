import pkg from "../package.json";

window.onload = () => {
  document.getElementById('version').innerText = pkg.version;
};