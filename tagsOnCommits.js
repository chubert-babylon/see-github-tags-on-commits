// ==UserScript==
// @name     Add tags to github commits
// @version  1.2
// @grant    none
// @include  https://github.com/*
// ==/UserScript==

console.log("github commit tagger loading");
var dictOfTagToHash = {};
if (!(localStorage.getItem("cxh-addTagsExtension-tagToHash") === null)) {
  dictOfTagToHash = JSON.parse(localStorage['cxh-addTagsExtension-tagToHash']);
}

async function getCommit(tag) {
  if (tag in dictOfTagToHash) {
    console.log("Using cached value of " + tag);
    return [tag,dictOfTagToHash[tag]];
  }
  const tagPage = await fetch('https://github.com' + tag).then((response) => {
    return response.text();
  }).then((text) => {
    return text;
  });
  console.log("Fetched hash of " + tag);
  const commitHash = tagPage.match(/<a [^>]*href=[^>]*\/commit\/[^>]*/g)[0].match(/commit\/[^"\/]*/g)[0].replace(/.*commit./, "");
  dictOfTagToHash[tag] = commitHash;
  localStorage.setItem('cxh-addTagsExtension-tagToHash', JSON.stringify(dictOfTagToHash));
  return [tag,commitHash];
}

function addCommitTags(item) {
  const hash = item.href.replace(/.*commit./, "");
  const repo = item.href.replace(/.commit.*/, "");
  fetch(repo + '/branch_commits/' + hash)
  .then((response) => {
    return response.text();
  })
  .then((branches) => {
    const commitHashPromises = branches.match(/\/[^"]*\/tag\/[^"]*/g).map(tag => getCommit(tag));
    Promise.all(commitHashPromises).then(
      responses => {
        const tags = responses.filter(r=>r[1] === hash).map(r=>r[0]);
        const tagLinks = tags.map(tag => "<svg aria-hidden=\"true\" height=\"16\" viewBox=\"0 0 16 16\" version=\"1.1\" width=\"16\" data-view-component=\"true\" class=\"octicon octicon-tag\"><path fill-rule=\"evenodd\" d=\"M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z\"></path></svg>"+
                                  " <a href=\"" + tag + "\">" + tag.replace(/.*\//g,"") + "</a>").reduce((a,b) => a+b, "");
        const commitHtmlGroupChildren = item.parentElement.parentElement.parentElement.children[0].children;
        commitHtmlGroupChildren[commitHtmlGroupChildren.length - 1].innerHTML += tagLinks;
      });
  });

}
  
function doThings() {
   document.querySelectorAll('.text-mono.f6').forEach(item => addCommitTags(item));
//   addCommitTags(document.querySelectorAll('.text-mono.f6')[0]);
}
window.addEventListener('load', function() {try {doThings(); }catch(e){console.log(e)};});
