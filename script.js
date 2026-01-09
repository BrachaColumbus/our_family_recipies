// הנתונים האישיים שלך
const OWNER = 'BrachaColumbus'; 
const REPO = 'our_family_recipies';
const FILE_PATH = 'recipes.json';

let currentUser = "";
let allMyRecipes = [];
let editingIndex = null;
let hasLiked = false; // לניהול לייקים

// פונקציית התחברות
let TOKEN = ""; 
const part1 = "ghp_MQt8otTpwcEFn8pI"; // חצי ראשון
const part2 = "JIINq2p74o8Ypi3jOOzM"; // חצי שני
const FAMILY_PASS = "משפחת קולומבוס המקסימה";
// הסיסמה שאת נותנת למשפחה
const miryampass="מרים גליק"
function login() {
    currentUser = document.getElementById('username').value.trim();
    const userPass = prompt("הזינו סיסמה משפחתית כדי לאפשר הוספת מתכונים:");

    if (currentUser && (userPass === FAMILY_PASS || userPass === miryampass)) {
        // חיבור הטוקן רק אם הסיסמה נכונה
        TOKEN = part1 + part2; 
        
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('recipe-list-screen').style.display = 'block';
        document.getElementById('display-user').innerText = currentUser;
        loadRecipes();
        alert("ברוכים הבאים למטבח! הסיסמה אושרה ✨");
    } else {
        alert("שם משתמש או סיסמה לא נכונים. (רמז: הסיסמה שברכי נתנה לכם)");
    }
}
// טעינת מתכונים
async function loadRecipes() {
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        if (!response.ok) return;
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        const content = JSON.parse(decodedContent);
        
        allMyRecipes = content.filter(r => r.user === currentUser);
        renderRecipes(allMyRecipes);
    } catch (e) {
        console.error("שגיאה בטעינה:", e);
    }
}

// הצגת רשימת המתכונים
function renderRecipes(recipesToDisplay) {
    const list = document.getElementById('recipes-list');
    list.innerHTML = '';
    
    recipesToDisplay.forEach((recipe, index) => {
        list.innerHTML += `
            <div class="recipe-card slide-in" onclick="openFullRecipe(${index})">
                <div class="recipe-header">
                    <h3>${recipe.title} <span class="emoji">🥘</span></h3>
                    <span class="arrow">⬅</span>
                </div>
            </div>`;
    });
}

// פתיחת מתכון
function openFullRecipe(index) {
    const recipe = allMyRecipes[index];
    
    document.getElementById('recipe-list-screen').style.display = 'none';
    const screen = document.getElementById('single-recipe-screen');
    screen.style.display = 'block'; 

    const content = document.getElementById('full-recipe-content');
    content.innerHTML = `
        <h1 class="elegant-title">${recipe.title}</h1>
        <div class="section-box">
            <h3>🌿 המצרכים</h3>
            <p>${recipe.ing}</p>
        </div>
        <div class="section-box">
            <h3>👩‍🍳 אופן ההכנה</h3>
            <p>${recipe.inst}</p>
        </div>
    `;

    // חיבור כפתורי עריכה ומחיקה
    document.getElementById('edit-btn-placeholder').onclick = () => editRecipe(index);
    document.getElementById('delete-btn-placeholder').onclick = () => deleteRecipe(index);

    // תיקון כאן: איפוס לייק בצורה בטוחה
    hasLiked = false;
    const likeCountSpan = document.getElementById('like-count');
    if (likeCountSpan) {
        likeCountSpan.innerText = "0";
    }
    
    window.scrollTo(0, 0);
}

// כלי עזר: מוזיקה, הקראה ולייקים

function readRecipe() {
    const btn = event.currentTarget;
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        btn.innerHTML = '🔊'; 
        return;
    }

    const title = document.querySelector('#full-recipe-content h1').innerText;
    const content = document.querySelector('#full-recipe-content').innerText;
    const utterance = new SpeechSynthesisUtterance(title + ". " + content);
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    
    btn.innerHTML = '🔇'; 
    utterance.onend = () => btn.innerHTML = '🔊';
    window.speechSynthesis.speak(utterance);
}

// ניהול לייקים ודיסלייקים
function handleVote(type) {
    const likeSpan = document.getElementById('like-count');
    let currentCount = parseInt(likeSpan.innerText);
    const btn = event.currentTarget;

    if (type === 'up') {
        currentCount++;
        // אפקט קטן של קפיצה
        btn.style.transform = "scale(1.3)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    } else {
        currentCount--;
        // אפקט קטן של רעידה
        btn.style.transform = "rotate(-20deg)";
        setTimeout(() => btn.style.transform = "rotate(0)", 200);
    }

    likeSpan.innerText = currentCount;
}

// פונקציית מוזיקה מעודכנת עם בדיקת שגיאות
let isMusicLoading = false; // משתנה למניעת התנגשויות

// משתנה גלובלי (שימי אותו בתחילת הקובץ למעלה)
let isProcessingMusic = false;

let isToggleLocked = false;

let isActionInProgress = false; // משתנה למניעת כפילויות

let lastClickTime = 0;

// משתנה גלובלי שיחזיק את הנגן מחוץ לפונקציה
var myMagicPlayer = null; 

var myMagicPlayer = null; 

async function toggleMusic(event) {
    if (event) event.stopPropagation();
    
    const btn = event.currentTarget;
    // כאן את כותבת את שם הקובץ ששמת בתיקייה
    const audioUrl = "song.mp3"; 

    if (!myMagicPlayer) {
        myMagicPlayer = new Audio(audioUrl);
        myMagicPlayer.loop = true;
    }

    try {
        if (myMagicPlayer.paused) {
            await myMagicPlayer.play();
            btn.innerHTML = "🎶";
            btn.style.background = "#D4AF37";
            console.log("מנגן מהקובץ המקומי!");
        } else {
            myMagicPlayer.pause();
            btn.innerHTML = "🎵";
            btn.style.background = "white";
        }
    } catch (err) {
        console.error("שגיאה:", err.message);
        alert("גם הקובץ המקומי לא נטען. ודאי ששם הקובץ בקוד זהה לשם הקובץ בתיקייה!");
    }
}
// ניהול מסכים
function showListScreen() {
    document.getElementById('add-recipe-screen').style.display = 'none';
    document.getElementById('single-recipe-screen').style.display = 'none';
    document.getElementById('recipe-list-screen').style.display = 'block';
    editingIndex = null;
    loadRecipes();
}

function showAddRecipeScreen() {
    document.getElementById('recipe-list-screen').style.display = 'none';
    document.getElementById('single-recipe-screen').style.display = 'none';
    document.getElementById('add-recipe-screen').style.display = 'block';
    if (editingIndex === null) {
        document.querySelector('.add-edit-title').innerText = "הוספת מתכון חדש 📝";
        clearForm();
    }
}

function editRecipe(index) {
    const recipe = allMyRecipes[index];
    editingIndex = index;
    document.getElementById('recipe-title').value = recipe.title;
    document.getElementById('recipe-ingredients').value = recipe.ing;
    document.getElementById('recipe-instructions').value = recipe.inst;
    showAddRecipeScreen();
    document.querySelector('.add-edit-title').innerText = "עריכת מתכון  ✨";
}

async function saveRecipe() {
    const title = document.getElementById('recipe-title').value;
    const ing = document.getElementById('recipe-ingredients').value;
    const inst = document.getElementById('recipe-instructions').value;

    if (!title || !ing || !inst) {
        alert("נא למלא את כל השדות ✨");
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        let content = JSON.parse(decodedContent);

        if (editingIndex !== null) {
            const oldRecipe = allMyRecipes[editingIndex];
            const idxInFull = content.findIndex(r => r.title === oldRecipe.title && r.user === currentUser);
            if (idxInFull !== -1) content[idxInFull] = { title, ing, inst, user: currentUser };
        } else {
            content.push({ title, ing, inst, user: currentUser });
        }

        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content))));
        await updateGitHub(encoded, fileData.sha, "עדכון מתכון");
        alert("נשמר בהצלחה! 👑");
        showListScreen();
    } catch (e) {
        alert("שגיאה בשמירה");
    }
}

async function deleteRecipe(index) {
    if (!confirm("למחוק את המתכון? 🗑")) return;
    const recipeToDelete = allMyRecipes[index];
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        let content = JSON.parse(decodedContent);
        content = content.filter(r => !(r.title === recipeToDelete.title && r.user === currentUser));
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content))));
        await updateGitHub(encoded, fileData.sha, "מחיקת מתכון");
        showListScreen();
    } catch (e) {
        alert("שגיאה במחיקה");
    }
}

async function updateGitHub(contentEncoded, sha, message) {
    return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: contentEncoded, sha })
    });
}

function filterRecipes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = allMyRecipes.filter(r => r.title.toLowerCase().includes(searchTerm));
    renderRecipes(filtered);
}

function clearForm() {
    document.getElementById('recipe-title').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';

}

