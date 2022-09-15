const N3 = require("n3");
import jsonld from "jsonld";

export function getRDFasJson(url, frame, fetch) {
  if (!fetch) throw new Error("No fetch function is provided.");

  if (url.startsWith("test:")) return dummyData[url];

  return new Promise(async (resolve, reject) => {
    // mostly taken from ldfetch
    //We like quads, so preference to serializations that we can parse fast with quads
    //Then comes JSON-LD, which is slower to parse
    //Then comes rdf/xml, turtle and n-triples, which we support in a fast manner, but it doesn’t contain named graphs
    //We also support HTML, but that’s really slow
    //We also support N3 and parse it quite fast, but we won’t do anything special with the N3 rules, so put it to low q
    var accept =
      "application/trig;q=1.0,application/n-quads,application/ld+json;q=0.9,application/rdf+xml;q=0.8,text/turtle,application/n-triples";

    const myInit = {
      method: "GET",
      headers: { accept: accept },
      mode: "cors",
      cache: "default",
    };

    try {
      const response = await fetch(url, myInit);
      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      const turtle = await response.text();
      console.log(turtle);
      console.log("---------");
      const parser = new N3.Parser({ format: "text/turtle", baseIRI: url });
      const quads = [];

      parser.parse(turtle, (error, quad) => {
        if (error) {
          reject(error);
        } else if (quad) {
          quads.push(quad);
        } else {
          const writer = new N3.Writer({ format: "application/n-quads" });
          writer.addQuads(quads);
          writer.end(async (error, result) => {
            if (error) {
              reject(error);
            } else {
              // console.log(result);
              try {
                let doc = await jsonld.fromRDF(result, {
                  format: "application/n-quads",
                });
                doc = await jsonld.frame(doc, frame);
                resolve(doc);
              } catch (err) {
                reject("JSON-LD conversion error");
              }
            }
          });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
