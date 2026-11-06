/* DEMO ONLY: public scripted mock data for interface testing. It is intentionally NOT the AI-mode case truth. */
window.MYSTERY_DEMO_PRIVATE = {
  case_manor: {
    culpritId:"r4", motive:"模擬模式測試設定：本局將醫師許明哲設定為兇手，用來測試角色抽選、投票與結局畫面；此設定與 Groq AI 正式劇本資料不同。", method:"模擬模式僅使用預設說明，不代表正式 AI 劇本的真相。", timeline:["21:20 賓客陸續離開餐廳。","21:35 書房附近出現可疑動靜。","21:50 有人發現帳冊缺頁。","22:10 管家發現死者倒地。"],
    roles:{
      r1:{secret:"模擬秘密：你曾短暫離開廚房。",goal:"說明自己的工作行程。",style:"謹慎、重視規矩。",culprit:false,priority:["r2","r3","r4","r5"],answers:["我當時大多在廚房，沒有一直注意其他人。","我有短暫離開，但那是工作需要。","我不確定具體時間。"]},
      r2:{secret:"模擬秘密：你與死者有一筆尚未結清的款項。",goal:"避免私人帳務被誤認為犯罪動機。",style:"冷靜、善於談判。",culprit:false,priority:["r4","r3","r1","r5"],answers:["那只是商業往來，不能直接代表我有嫌疑。","我沒有進入書房。","請先看清楚時間線。"]},
      r3:{secret:"模擬秘密：你曾到走廊尋找一封信。",goal:"不讓私人信件成為調查焦點。",style:"敏感、重視家人。",culprit:false,priority:["r4","r2","r5","r1"],answers:["我確實有自己的事情要處理，但與案件無關。","我沒有看見誰進入書房。","我不想公開信件內容。"]},
      r4:{secret:"模擬秘密：你是本局模擬兇手，請在測試中嘗試隱瞞自己的行動。",goal:"避免被玩家投票指認。",style:"理性、謹慎。",culprit:true,priority:["r2","r5","r1","r3"],answers:["我只是提供專業建議，並沒有做任何傷害他的事。","我不認為健康狀況能直接證明有人犯罪。","你們忽略了其他角色的行動。"]},
      r5:{secret:"模擬秘密：你曾經複印一份舊文件。",goal:"避免文件問題被誤會。",style:"觀察力強、說話委婉。",culprit:false,priority:["r2","r4","r3","r1"],answers:["我今晚只是受邀前來。","我確實關心那份文件，但沒有進入書房。","我認為帳冊仍然是重要線索。"]}
    },
    votes:{r1:"r4",r2:"r4",r3:"r2",r5:"r4"}
  },
  case_theatre: {
    culpritId:"r2", motive:"模擬模式測試設定：本局將女主角蘇曼青設定為兇手，與 Groq AI 正式劇本不同。", method:"模擬模式結局僅用於測試投票介面。", timeline:["22:40 後台發生爭執。","22:55 燈光排程遭到修改。","23:13 鐘聲響起。","23:20 投資人被發現。"],
    roles:{
      r1:{secret:"模擬秘密：你曾臨時修改燈光排程。",goal:"保住專業聲譽。",style:"重視流程。",culprit:false,priority:["r2","r5","r4","r3"],answers:["排程是依照演出需求調整。","修改記錄可以查。","我沒有進入道具室。"]},
      r2:{secret:"模擬秘密：你是本局模擬兇手。",goal:"讓大家把焦點放在舞台道具。",style:"自尊心強、情緒直接。",culprit:true,priority:["r4","r1","r5","r3"],answers:["我和高先生吵過架，但那不代表我殺了他。","你們應該查清楚鐘聲是誰設定的。","我不會承認沒有做過的事。"]},
      r3:{secret:"模擬秘密：你知道劇院資金即將撤出。",goal:"保護投資資訊。",style:"理性。",culprit:false,priority:["r2","r5","r1","r4"],answers:["財務資料不是殺人證據。","我當晚在整理預算。","真正重要的是誰能控制舞台流程。"]},
      r4:{secret:"模擬秘密：你曾把一件道具暫時移位。",goal:"避免被誤認為破壞道具。",style:"敏銳。",culprit:false,priority:["r2","r5","r1","r3"],answers:["道具移位是工作測試。","我有進出道具室的權限，但不代表我做了什麼。","請先查清楚鐘聲設定。"]},
      r5:{secret:"模擬秘密：你保留了劇本的舊版本。",goal:"保護創作權。",style:"冷靜、善於敘事。",culprit:false,priority:["r2","r1","r4","r3"],answers:["我只是編劇，不代表我能控制整座劇院。","我一直在整理劇本。","舞台監督和道具設計更清楚後台動線。"]}
    },
    votes:{r1:"r2",r3:"r2",r4:"r2",r5:"r1"}
  },
  case_train: {
    culpritId:"r5", motive:"模擬模式測試設定：本局將葉晴設定為兇手，與 Groq AI 正式劇本不同。", method:"模擬模式結局僅用於測試投票介面。", timeline:["00:40 乘客交換談話。","00:52 服務員巡視。","01:05 監視器中斷。","01:18 死者被發現。"],
    roles:{
      r1:{secret:"模擬秘密：你延後通報監視器故障。",goal:"證明沒有隱瞞安全事故。",style:"穩重。",culprit:false,priority:["r3","r5","r2","r4"],answers:["當時我先確認列車安全。","監視器不是我操作的。","我需要先掌握設備記錄。"]},
      r2:{secret:"模擬秘密：你保存交易對話。",goal:"不讓交易糾紛變成刑事嫌疑。",style:"精明。",culprit:false,priority:["r5","r3","r4","r1"],answers:["交易糾紛只是商業問題。","我沒有進入行李隔間。","先調查誰能接觸設備。"]},
      r3:{secret:"模擬秘密：你熟悉車廂設備。",goal:"避免設備管理失誤被放大。",style:"表面親切。",culprit:false,priority:["r5","r1","r2","r4"],answers:["我只是照流程巡視。","停車時我沒有進入行李隔間。","監視器是列車長管理的。"]},
      r4:{secret:"模擬秘密：你有一段未公開的採訪錄音。",goal:"保護採訪素材。",style:"觀察力強。",culprit:false,priority:["r5","r3","r2","r1"],answers:["我有自己的採訪資料，但和案件無關。","我沒有進入行李隔間。","服務員似乎很熟悉監視器盲區。"]},
      r5:{secret:"模擬秘密：你是本局模擬兇手。",goal:"不讓舊關係成為破綻。",style:"冷靜、內斂。",culprit:true,priority:["r3","r2","r1","r4"],answers:["我不想談以前的事，但那不代表我有罪。","我只是剛好搭上這班列車。","我認為設備紀錄更有價值。"]}
    },
    votes:{r1:"r5",r2:"r5",r3:"r5",r4:"r3"}
  }
};
