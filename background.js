
const rip = {
    ".*\.medium.com": {
        'static':null,
        "dynamic": ['/html/body/div[1]/div/div[3]/div[2]/div[2]/article/div/div/section/div/div[2]'],
        "del":null
    },
    ".*\.wikipedia.org/wiki/.*":{
        'static':null,
        "dynamic":['//*[@id="content"]'],
        "del":null
    },
    "default":{
        'static':['//style', '//link'],
        'dynamic':['//body'],
        'del':['//script'],
    }
};

let linkUrl = {};

browser.contextMenus.create({
    id:"link url",
    title:"link this url",
    contexts: ["link"],
})

browser.contextMenus.create({
    id:"link site",
    title:"link this site",
    contexts:["page", "frame", "selection", "editable", "image", "video", "audio"],
})

browser.contextMenus.onClicked.addListener(async (info, tabs) => {
    const  urls = info.menuItemId.split(' ')
    if(urls[0] == "link"){
        const url = urls[1] == "url" ? info.linkUrl : "site" ? tabs.url : "";
        
        const res = await fetch(url);
        if(!res.ok) return `Invalid url, ${url}`;
        
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let def = rip["default"]
        for (const [k,v] of Object.entries(rip)) {
            const regex = new RegExp(k);
            
            if (regex.test(url)) {
                if(v.static) def.static = v.static;
                if(v.dynamic) def.dynamic = v.dynamic;
                if(v.del) def.del = v.dynamic;
                break;
            }
        }


        // For security reason Deleting `//script` is required but on removing if its throws an error that means its not a real url and we are under attack!
        // for example it doesnt attack commented script or hidden ones if you found a gaps in here please report it, thanks, the slayter team!
        function xpather(doci, xpaths) {
            const dom2=[]
            for (let i = 0; i < xpaths.length; i++) {
                const out = doci.evaluate(xpaths[i], doci, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                for (let ii = 0; ii < out.snapshotLength; ii++) 
                    dom2.push(out.snapshotItem(ii));
            }
            return dom2
        }

        xpather(doc, def.del).forEach(node => {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
        let static_dom = xpather(doc, def.static);
        let dynamic_dom = xpather(doc, def.dynamic);
      
        // create new dom
        let d = document.implementation.createHTMLDocument('Setup');
        d.head.innerHTML = static_dom.reduce((acc, current) => acc + current.outerHTML, '');
        d.body.innerHTML = dynamic_dom.reduce((acc, current) => acc + current.innerHTML, '');

        // fixes links 
        let dom_paths = [...d.getElementsByTagName('link'), ...d.getElementsByTagName('img'), ...d.getElementsByTagName('a')]
        const domain = url.match(/^https?:\/\/[^/]*/im)[0];
        for (let i=0; i < dom_paths.length; i++){
            if(dom_paths[i].href && dom_paths[i].href.startsWith('/')) dom_paths[i].href=`${domain}${dom_paths[i].href}`;
            if(dom_paths[i].src && dom_paths[i].src.startsWith('/')) dom_paths[i].src=`${domain}${dom_paths[i].src}`;
        }

        // const element = xpathOut.iterateNext();
        console.log(d)
        // linkUrl[url] = {head: d.head.outerHTML, body: [d.body.innerHTML]};
        
        

        linkUrl[url] = {head: d.head.outerHTML, body: [d.body.innerHTML]};

    } 
})

browser.runtime.onMessage.addListener(async (data, sender, sendRes) => {
    if (data.type === "fetch") {
        const response = await fetch(data.url);
        
        return await response.text();
    } else if(data.type == "get linked"){
        return linkUrl
    }
});



