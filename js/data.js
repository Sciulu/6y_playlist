// 全局配置
const CONFIG = {
    liveUrl: "https://live.bilibili.com/1732286123",    
    spaceUrl: "https://space.bilibili.com/3706994984749240",  
    pageSize: 16,                             
    // 【重要】在这里填入你发布的谷歌表格 CSV 链接
    sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrhGySqGngnvMkxIYxk7Y-KXkCWq6Fn1dKf331NpQrsGkdl7NZ1eMUdKDEhR7_bPAt2R9ltH6nXVzH/pub?output=csv" 
};

// 预留一个空数组给 app.js 填充数据
let rawSongs = [];