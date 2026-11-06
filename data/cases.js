/* Public scenario data. Keep private role cards and answers out of this file in real deployments. */
window.MYSTERY_CASES = [
  {
    id: "case_manor",
    title: "霧港山莊的最後一杯茶",
    subtitle: "暴風雨封鎖山莊，五名賓客都說自己與死亡無關。",
    genre: "古典推理・人際秘密",
    players: "1 位玩家 + 4 位 AI",
    duration: "約 25–40 分鐘",
    scene: "assets/scene/manor-temp.webp",
    sceneLabel: "霧港山莊・書房",
    cover: "assets/scene/manor-temp.webp",
    opening: [
      "今晚，海港附近的霧港山莊遭遇強烈暴風雨。山莊主人江承遠邀請五位與他關係密切的人共進晚餐，並表示晚餐後將宣布一項重要決定。",
      "晚間十點十分，管家在書房發現江承遠倒臥在書桌旁。桌上留著一只喝了一半的茶杯，旁邊還有一本缺了一頁的合作帳冊。",
      "暴風雨造成道路中斷，警方尚未抵達。五名在場人士都必須說明自己當晚的行動。你也在這場聚會之中；你可能是旁觀者，也可能正是所有人懷疑的對象。",
      "請記住：有秘密不代表就是兇手；看似合理的證詞，也不一定完全可信。"
    ],
    cast: [
      {id:"r1", number:1, name:"林予安", occupation:"山莊管家", relation:"受雇於死者多年，熟悉山莊日常運作。", portrait:"assets/portraits/chen-mo.webp", intro:"各位，我是林予安，在霧港山莊擔任管家已經六年。今晚的晚餐由我安排，晚餐後我大多在廚房整理餐具。江先生最近似乎有些煩惱，但我並不清楚他的商業事務。"},
      {id:"r2", number:2, name:"陳以恆", occupation:"商業合作夥伴", relation:"與死者合作多年，近期因帳務問題關係緊張。", portrait:"assets/portraits/lin-che.webp", intro:"我是陳以恆，與江先生合作經營事業多年。最近我們確實在帳務及公司未來方向上有過爭論，但生意上的意見不同很常見，並不代表我會傷害他。晚餐後我曾在一樓公共區域停留。"},
      {id:"r3", number:3, name:"周雨彤", occupation:"死者的外甥女", relation:"親屬，近期因家族財產及未來安排發生爭執。", portrait:"assets/portraits/su-yun.webp", intro:"我是周雨彤，江先生是我的舅舅。這次回山莊原本是想和他談談家裡的事情。舅舅最近對遺產安排十分堅持，我們偶爾會有爭執，但我不希望事情變成今天這樣。"},
      {id:"r4", number:4, name:"許明哲", occupation:"家庭醫師", relation:"死者多年的家庭醫師，也有私人交情。", portrait:"assets/portraits/xu-zhe.webp", intro:"我是許明哲，江先生的家庭醫師。我認識他多年，也知道他的身體狀況需要留意。今晚受邀前來主要是私人聚會，並非正式看診。關於病歷，我不方便在未經同意下透露太多。"},
      {id:"r5", number:5, name:"葉琳", occupation:"前任私人秘書", relation:"曾替死者處理私人行程與文件，半年前離職。", portrait:"assets/portraits/ye-lin.webp", intro:"我是葉琳，曾經擔任江先生的私人秘書。雖然我已經離職，但今晚仍收到邀請。江先生手上有一些我過去經手的文件，我希望能把事情說清楚，不想再被捲入他的商業糾紛。"}
    ],
    openingClues: [
      {id:"m1", title:"書房現場", content:"江承遠被發現倒在書桌旁，桌上有一只喝了一半的茶杯；門窗沒有明顯遭到破壞。"},
      {id:"m2", title:"缺頁的帳冊", content:"合作帳冊少了一頁。江承遠生前曾表示，近期要重新核對合作帳務。"}
    ],
    midClues: [
      {id:"m3", title:"廚房茶水紀錄", content:"晚間九點三十分左右曾準備一壺茶送往書房，但紀錄沒有寫明最後由誰送入房內。"},
      {id:"m4", title:"訪客登記簿", content:"晚間九點二十分，陳以恆曾詢問書房是否有人，表示要交付一份合作文件。"}
    ],
    discussionPrompt:"請根據公開證詞、帳冊缺頁與茶水紀錄，提出你目前最在意的一個矛盾。不要直接揭露未公開的私人秘密。"
  },
  {
    id: "case_theatre",
    title: "落幕前的第十三聲鐘",
    subtitle: "首演前夕，劇院投資人倒在舞台後台，最後一聲鐘響成了關鍵。",
    genre: "劇場懸疑・時間詭計",
    players: "1 位玩家 + 4 位 AI",
    duration: "約 30–45 分鐘",
    scene: "assets/scene/manor-temp.webp",
    sceneLabel: "舊劇院・後台（暫用場景素材）",
    cover: "assets/scene/manor-temp.webp",
    opening: [
      "今晚是「銀月劇院」新戲的封閉彩排。劇院投資人高啟文邀請五名核心工作人員留下，表示演出結束前要宣布劇院的重大變動。",
      "晚上十一點十三分，舞台監督在道具室發現高啟文倒地。舞台鐘聲剛好敲過第十三下，後台電力也短暫中斷。",
      "劇院大門已上鎖，外頭又下著大雨。當時留在劇院的五人都可能接近道具室。每個人都有自己的理由，不希望今晚的事情被揭開。",
      "你也是劇院的一員。請仔細聽取每個人的說法，注意時間、道具與舞台調度之間的矛盾。"
    ],
    cast: [
      {id:"r1", number:1, name:"江承安", occupation:"舞台監督", relation:"負責整場演出的流程與後台調度。", portrait:"assets/portraits/chen-mo.webp", intro:"我是江承安，負責今晚彩排的舞台監督。每個燈光、音效與進出場時間都由我安排。高先生今晚臨時更改了幾個段落，確實讓流程變得混亂，但我只想讓演出順利完成。"},
      {id:"r2", number:2, name:"蘇曼青", occupation:"女主角", relation:"與投資人有長期合作，也曾因角色安排發生衝突。", portrait:"assets/portraits/su-yun.webp", intro:"我是蘇曼青，這齣戲的女主角。高先生最近威脅要換掉我，理由是票房與合約。我承認我們在後台爭論過，但我不可能為了一個角色做出無法挽回的事。"},
      {id:"r3", number:3, name:"陳以澄", occupation:"劇院投資顧問", relation:"負責劇院資金與演出預算，掌握財務資料。", portrait:"assets/portraits/lin-che.webp", intro:"我是陳以澄，負責劇院投資與帳務規劃。高先生最近要求我重新整理支出紀錄，這讓不少人感到不安。我今晚一直在確認預算文件，並沒有參與舞台上的演出。"},
      {id:"r4", number:4, name:"葉芷晴", occupation:"服裝與道具設計", relation:"長期負責戲服及重要道具，能自由進出道具室。", portrait:"assets/portraits/ye-lin.webp", intro:"我是葉芷晴，負責服裝和道具。道具室裡的東西幾乎都是我管理的。高先生曾要求我替換一件重要道具，我不太認同他的決定，但我只是照工作流程處理。"},
      {id:"r5", number:5, name:"許知遠", occupation:"編劇", relation:"劇本作者，與投資人因結局修改產生爭議。", portrait:"assets/portraits/xu-zhe.webp", intro:"我是許知遠，這齣戲的編劇。高先生希望修改結局，讓故事變得更商業化，我不願意接受。我晚間大多待在觀眾席附近整理劇本，對後台發生的事並不完全清楚。"}
    ],
    openingClues: [
      {id:"t1",title:"停擺的後台時鐘",content:"道具室外的時鐘停在十一點十三分，但舞台控制台的記錄顯示鐘聲播放時間可能曾被修改。"},
      {id:"t2",title:"被移動的道具箱",content:"一個大型道具箱的位置與彩排前的配置圖不同，箱蓋上有新鮮的擦痕。"}
    ],
    midClues: [
      {id:"t3",title:"燈光控制紀錄",content:"短暫斷電前，有人手動切換過後台照明；操作時間與第十三聲鐘響接近。"},
      {id:"t4",title:"修改過的劇本頁",content:"高啟文桌上留有一頁被重新標記的劇本，旁邊寫著「最後一幕必須照原版」。"}
    ],
    discussionPrompt:"請根據第十三聲鐘、燈光紀錄和道具箱位置，提出最值得追查的時間矛盾。"
  },
  {
    id: "case_train",
    title: "七號車廂的最後一站",
    subtitle: "暴雨讓列車停在山間隧道，車廂裡少了一名乘客。",
    genre: "封閉空間・時間推理",
    players: "1 位玩家 + 4 位 AI",
    duration: "約 30–45 分鐘",
    scene: "assets/scene/manor-temp.webp",
    sceneLabel: "夜行列車・七號車廂（暫用場景素材）",
    cover: "assets/scene/manor-temp.webp",
    opening: [
      "凌晨的夜行列車因暴雨停在山區隧道。列車重新啟動前，乘客發現七號車廂的收藏家方世傑不見了，稍後被發現倒在相鄰的行李隔間。",
      "車廂門在停車期間並未開啟，列車監視器卻有一段短暫的影像缺失。當時留在七號車廂附近的五人，都聲稱沒有離開自己的位置。",
      "列車長已通知前方車站，但抵達前仍有一段時間。你必須在這段時間內，透過公開詢問找出誰在說謊。",
      "列車上沒有真正的陌生人：每個人都可能認識死者，也可能只是想隱藏另一件與案件無關的事。"
    ],
    cast: [
      {id:"r1",number:1,name:"顧明川",occupation:"列車長",relation:"負責列車運行與乘客安全。",portrait:"assets/portraits/chen-mo.webp",intro:"我是顧明川，今晚負責這班夜行列車。停車期間我一直在確認安全與通訊狀況。方先生是常客，我知道他帶著重要行李，但我沒有理由接觸他的收藏品。"},
      {id:"r2",number:2,name:"林映雪",occupation:"收藏品交易商",relation:"與死者有收藏品交易往來，近期發生價格爭議。",portrait:"assets/portraits/su-yun.webp",intro:"我是林映雪，與方先生有過幾次收藏品交易。最近一筆交易確實不太愉快，但我只是想把價格談清楚。停車時我留在座位附近，沒有進入行李隔間。"},
      {id:"r3",number:3,name:"周凱",occupation:"列車服務員",relation:"負責七號車廂乘客服務，熟悉車廂設備。",portrait:"assets/portraits/lin-che.webp",intro:"我是周凱，負責七號車廂的服務。停車時我有巡視過走道，因為有乘客反映燈光閃爍。方先生曾問我行李隔間的位置，但我沒有幫他搬運物品。"},
      {id:"r4",number:4,name:"許文修",occupation:"旅行作家",relation:"曾採訪死者，正在撰寫一篇收藏市場報導。",portrait:"assets/portraits/xu-zhe.webp",intro:"我是許文修，正在寫一篇關於收藏市場的報導。方先生曾拒絕我的採訪，今晚我們也沒有特別交談。我停車後一直在整理筆記，對監視器的事情並不知情。"},
      {id:"r5",number:5,name:"葉晴",occupation:"死者的舊識",relation:"與死者相識多年，雙方有一段未解的過去。",portrait:"assets/portraits/ye-lin.webp",intro:"我是葉晴，和方先生認識很多年。這次只是剛好搭上同一班列車。過去的事情我不想再提，也不希望其他人把私人關係和這起案件混為一談。"}
    ],
    openingClues: [
      {id:"r1c1",title:"七號車廂座位表",content:"死者原本坐在 7A，五名相關人士都能在短時間內抵達行李隔間。"},
      {id:"r1c2",title:"監視器缺失片段",content:"停車期間有約四分鐘的影像缺失，但系統沒有記錄是誰操作設備。"}
    ],
    midClues: [
      {id:"r1c3",title:"行李隔間門扣",content:"門扣上有新的刮痕，顯示停車期間可能有人多次開關隔間。"},
      {id:"r1c4",title:"遺失的車票副本",content:"死者座位旁找到一張不同日期的車票副本，背面有一串未完成的數字。"}
    ],
    discussionPrompt:"請依照監視器缺失、門扣刮痕及乘客行動，指出最需要釐清的時間點。"
  }
];
