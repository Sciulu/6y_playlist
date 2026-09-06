// 全局配置
const CONFIG = {
    liveUrl: "https://live.bilibili.com/1732286123",    
    spaceUrl: "https://space.bilibili.com/3706994984749240",  
    pageSize: 16,                             
    sheetCsvUrl: "js/songs.csv", // 你的本地CSV路径
    
    // 【新增】Supabase 数据库配置
    supabaseUrl: "https://gitfkznplfziqlhykdqq.supabase.co", // 替换为你找到的 Project URL
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdGZrem5wbGZ6aXFsaHlrZHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2ODcxOTAsImV4cCI6MjEwNDI2MzE5MH0.lxtlx6NKTdplHlep_ibp_HTd2dhJb4r7esryz80AvHk" // 替换为你复制的极长的 anon key
};

let rawSongs = [];