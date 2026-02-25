

let allProducts = []; // 用來存放從 Ragic 抓回來的原始資料
//存儲目前使用者填寫的數量
let cartStorage = {};

// 專門負責把資料轉成 HTML 的函式
function renderProducts(dataList) {
    const listDiv = document.getElementById('product-list');
    listDiv.innerHTML = '';

    dataList.forEach((item) => {
        const name = item['貨品名稱'];
        const img = item['圖片'] || "black.png";
        const itemId = item['貨品編號'];
        const itemUnitList = item['_subtable_1000785'] ? Object.values(item['_subtable_1000785']) : [];

        let cardHtml = `
            <div class="product-card">
                <div class="product-header">
                    <img src="${img}" class="product-img" onerror="this.src='black.png'">
                    <div class="product-info">
                        <b>${name}</b><br>
                        <span>編號: ${itemId}</span>
                    </div>
                </div>
                <div class="unit-container">
        `;

        itemUnitList.forEach(element => {
            cardHtml += `
                <div class="unit-row">
                    <span class="unit-label">單位：${element['單位']}</span>
                    <input type="number" class="qty-input" 
                        id="${element['貨品單位細項編號']}" 
                        data-name="${name}" 
                        data-unit="${element['單位']}" 
                        data-itemId="${itemId}"
                        min="0" value="0">
                </div>
            `;
        });

        cardHtml += `</div></div>`;
        listDiv.innerHTML += cardHtml;
    });
}
async function fetchProducts() {
    try {
        const res = await fetch('https://nonintoxicative-collin-nematic.ngrok-free.dev/searchProduct', {
            method: 'GET',
            headers: {
                // 這行最重要：告訴 ngrok 不要顯示警告頁面
                'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json'
            }
        });

        // 先檢查回應內容是否真的是 JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("收到的不是 JSON，而是：", text);
            throw new TypeError("伺服器回傳了非 JSON 內容 (可能是 HTML 報錯頁面)");
        }

        const data = await res.json();
        // 將 Ragic 的物件格式轉為陣列方便處理
        allProducts = Object.values(data); 
        
        // 執行初始渲染
        renderProducts(allProducts);
    
    } catch (e) {
        console.error("載入失敗:", e);
    }
}

async function submitOrder() {
    const inputs = document.querySelectorAll('.qty-input');
    let orderDetails = [];
    let showMessage=[];
    
    inputs.forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const name = input.getAttribute('data-name');
            const unit = input.getAttribute('data-unit');
            const UnitId=input.getAttribute('id');//出貨單位編號
            const itemId=input.getAttribute('data-itemId');//商品編號
            // 這裡可以同時紀錄 ID，方便 Python 處理
            orderDetails.push({itemId:itemId, UnitId:UnitId,qty:qty});
            showMessage.push(`${name} (${qty}${unit})`)
        }
    });

    if (orderDetails.length === 0) {
        alert("請選擇數量！");
        return;
    }

    const messageText = "📋 訂購明細：\n" + showMessage.join("\n");
    console.log(messageText);

    await liff.sendMessages([{ type: 'text', text: messageText },{ type: 'text', text: JSON.stringify(orderDetails) }]);
    liff.closeWindow();
}

function saveCurrentQtys() {
    const inputs = document.querySelectorAll('.qty-input');
    inputs.forEach(input => {
        if (parseInt(input.value) > 0) {
            cartStorage[input.id] = input.value;
        } else {
            delete cartStorage[input.id];
        }
    });
}

function search() {
    saveCurrentQtys(); // 搜尋前先存下目前的數量
    
    const keyword = document.getElementById('searchText').value.toLowerCase().trim();
    const filtered = allProducts.filter(item => {
        return (item['貨品名稱'] || "").toLowerCase().includes(keyword) || 
            (item['貨品編號'] || "").toLowerCase().includes(keyword);
    });

    renderProducts(filtered);
    
    // 渲染後，把存好的數量填回去
    Object.keys(cartStorage).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = cartStorage[id];
    });
}

async function init() {
    await liff.init({ liffId: "2009214081-QU27RD0h" });
    // if (!liff.isLoggedIn()) { liff.login(); }
    fetchProducts();
}
init();
// fetchProducts();
