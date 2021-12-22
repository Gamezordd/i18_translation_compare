const FS = require('fs');
const Path = require("path")

function getFilesRecursively(initialPath) {
  const Files = [];
  function ThroughDirectory(Directory) {
    FS.readdirSync(Directory).forEach(File => {
      if(File[0] !== '.'){
        const Absolute = Path.join(Directory, File);
        if (FS.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
        else return Files.push(Absolute);
      }
    });
  }

  ThroughDirectory(initialPath);
  return Files;
}

const loadLocalesAndNamespaces = (files) => {
  const locales = new Set();
  const namespaces = {};

  files.forEach(path => {
    const pathArray = path.split('/');
    const nameSpace = pathArray[pathArray.length - 2];

    if(!locales.has(nameSpace)) locales.add(nameSpace);
    if(!namespaces[nameSpace]){
      namespaces[nameSpace] = new Set();
    }
    namespaces[nameSpace].add(pathArray[pathArray.length - 1]);
  })
  const localesArr = [];

  locales.forEach(locale => localesArr.push(locale));

  return [localesArr, namespaces];
}

const findMissingNamespaces = (locales, namespaces) => {
  const absent = {};
  const masterSet = new Set();

  for(let i = 0; i < locales.length; i++){
    const currLocale = locales[i];
    namespaces[currLocale].forEach(namespace => {
      if(!masterSet.has(namespace)) masterSet.add(namespace);
    })
    
  }
  for(let i = 0; (i < locales.length); i++){
    const currLocale = locales[i];
    const thisLocaleSet = new Set();
    namespaces[currLocale].forEach(namespace => {
      thisLocaleSet.add(namespace);
    });

    masterSet.forEach(namespace => {
      if(!thisLocaleSet.has(namespace)){
        if(!absent[currLocale]) absent[currLocale] = [];
        absent[currLocale].push(namespace);
      }
    })
  }
  return absent;
}

const compareTranslations = (fileArray) => {
  const masterSet = new Set();
  const absentTranslations = {};
  const repeatedKeys= {};

  fileArray.forEach(filePath => {
    const file1 = JSON.parse(FS.readFileSync(filePath));

    Object.keys(file1).forEach(key => {
      if(!masterSet.has(key)) masterSet.add(key);
    });
  })

  fileArray.forEach(filePath => {
    const fileSet = new Set();

    const file1 = JSON.parse(FS.readFileSync(filePath));

    Object.keys(file1).forEach(key => {
      if(!fileSet.has(key)) fileSet.add(key);
      else{
        if(!repeatedKeys[filePath]) repeatedKeys[filePath] = [];
        repeatedKeys[filePath].push(key);
      }
    });

    masterSet.forEach(key => {
      if(!fileSet.has(key)){
        if(!absentTranslations[filePath]) absentTranslations[filePath] = [];
        absentTranslations[filePath].push(key);
      }
    })
  })

  return {absentTranslations, repeatedKeys};
}

(() => {
  const args = process.argv.slice(2);
  const path1 = args[0];
  const translationList1 = getFilesRecursively(path1);
  const [locales, namespaces] = loadLocalesAndNamespaces(translationList1);
  const absentNamespaces = findMissingNamespaces(locales,namespaces);
  const {absentTranslations, repeatedKeys} = compareTranslations(translationList1);

  //Print Files indexed
  console.log("\x1b[47m\x1b[31m","File Index: \x1b[40m\x1b[31m\x1b[0m", translationList1);
  //Print Absent Namespaces
  console.log("\x1b[47m\x1b[31m","Absent Namespaces: \x1b[40m\x1b[31m\x1b[0m",absentNamespaces);
  //Print absent translations (keys)
  console.log("\x1b[47m\x1b[31m","Absent Translations: \x1b[40m\x1b[31m\x1b[0m", absentTranslations);
  //Print repeated keys
  console.log("\x1b[47m\x1b[31m","Repeated keys: \x1b[40m\x1b[31m\x1b[0m", repeatedKeys);
  return 0;
})();
