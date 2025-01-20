// 1.Preluare automată la pornirea aplicației a datelor curente despre PIB pe cap de locuitor/ Speranta Viata / Populatie pentru țările UE pentru 
// ultimii 15 ani disponibili și procesare pentru aducerea la forma din fișierul furnizat.

//Care este ultimul an disponibil?

const url_ultimul_an="https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1&geo=BG";
async function ultimul_an() {
    const response=await fetch(url_ultimul_an);
    const date_json=await response.json();
    const ani_disponibili=await Object.keys(date_json.dimension.time.category.index);
    console.log("Ani disponibili: ",ani_disponibili);
}
ultimul_an(); //2023

//Generez o variabila de tip string care contine tarile sub forma de parametrii pe care ii putem utiliza in url
const lista_tari=["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE" ];
function tari_parametrii(lista_tari){
    const vector_tari=lista_tari.map(tara=>`&geo=${tara}`).join("");
    return vector_tari;
}
const parametrii_tari=tari_parametrii(lista_tari);

//generez o variabila de tip string care contine ultimii 15 ani disponibili 
function ani_parametrii(ultimulAn,nrAni){
    const vector_ani=Array.from({length:nrAni},(_,i)=>ultimulAn-i).map(an=>`&time=${an}`).join("");
    return vector_ani;
}
const ultimulAn=2023;
const nrAni=15;
const parametrii=ani_parametrii(ultimulAn,nrAni);

//construiesc o functie pentru a aplica cereri Fetch catre API-ului Eurostat
async function fetch_url(url) {
    try{
        const response=await fetch(url);
        if(!response.ok)
        {
            throw new Error(`Eroare la preluarea datelor`);
        }
        const res_json=await response.json();
        return res_json;
    }
    catch(error){
        console.error("Eroare:",error.message);
    }
}

//dimension.geo --> contine tarile 
//dimension.time --> contine anii
//value --> contine valorile indicatorilor

/*"geo": {
      "label": "Geopolitical entity (reporting)",
      "category": {
        "index": {
          "BG": 0,
          "RO": 1
        },*/ 
/*"time": {
      "label": "Time",
      "category": {
        "index": {
          "2019": 0,
          "2020": 1
        },*/
/* "value": {
    "0": 74.6,
    "1": 72.7,
    "2": 75,
    "3": 73.6*/

//O sa folosesc datele preluate din cererile catre API-ul Eurostat pentru a procesa datele sub forma unui JSON
function proceseaza_date(date,denumire_indicator){
    const vector_elemente=[];
    try{
    if(!date.dimension || !date.dimension.geo || !date.dimension.time)
    {
        throw new Error(`Eroare la procesarea datelor in dimension`);
    }
        const tari=Object.keys(date.dimension.geo.category.index);
        const ani=Object.keys(date.dimension.time.category.index);
        const valori_indicatori=date.value;

        for(var i=0;i<tari.length;i++)
        {
            const tara=tari[i];
            const index_tara=i*ani.length;//pentru fiecare tara avem 14/15 valori ==> tara1 - index 0 / tara2 - index 15 ...
            for(var j=0;j<ani.length;j++)
            {
                const an=ani[j];
                const valoare_indicator=valori_indicatori[index_tara+j];//BG (index 0), 2020 (index 1)==> valoarea indicatorului la index=0+1=1 (72.7)
                if(tara!==undefined && an!==undefined && valoare_indicator!==undefined)
                {
                    vector_elemente.push({
                        tara:tara,
                        an:an,
                        indicator: denumire_indicator,
                        valoare: valoare_indicator
                    });
                }
            }
        }
    }
    catch(error)
    {
        console.error("Eroare la procesarea datelor:",error.message);
        return [];
    }
    return vector_elemente;
}

//Aceasta functie va fi apelata de fiecare data cand aplicatia este incarcata, iar datele din PIB, Pop, SV sunt representate sub forma JSON-ului din folderul media
let PIB;
let SV;
let Pop;
async function date_url() {
    const pib_url=`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB${parametrii}${parametrii_tari}`;
    const populatie_url=`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?sex=T&age=TOTAL${parametrii}${parametrii_tari}`;
    const sperantaLaViata_url=`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1${parametrii}${parametrii_tari}`;
    
    try{
        const [date_pib,date_populatie,date_sperantaViata]=await Promise.all(
            [fetch_url(pib_url),fetch_url(populatie_url),fetch_url(sperantaLaViata_url)]);

        seteaza_tara_indicator(date_populatie);//populez dropdown-urile

        PIB=await proceseaza_date(date_pib,"PIB");
        SV=await proceseaza_date(date_sperantaViata,"SV");
        Pop=await proceseaza_date(date_populatie,"Pop");

        console.log(PIB);
        console.log(SV);
        console.log(Pop);

        creeaza_tabel(an_selectat);
        creeaza_legenda_tabel();
        creeaza_bubbleChart(an_selectat);
        creeaza_legenda_bubbleChart();
    }
    catch(error)
    {
        console.error("Eroare:",error.message);
    }
}

//Pe pagina principala vor crea 2 dropdown-uri care contin toate tarile si toti indicatorii
function seteaza_tara_indicator(data)
{
    if(data.dimension && data.dimension.geo)
    {
        const label_tari=data.dimension.geo.category.label;
        const nume_intreg=Object.values(label_tari);
        const prescurtare=Object.keys(label_tari);

        selector_tara=document.getElementById("tara");
        selector_indicator=document.getElementById("indicator");
        nume_intreg.forEach((nume,i)=>{
            const item=document.createElement("option");
            item.value=prescurtare[i];
            item.textContent=nume;
            selector_tara.appendChild(item);
        });
       
        const indicatori=[{value:"PIB",text:"PIB"},{value:"Pop",text:"Populatie"},{value:"SV",text:"Speranta la viata"}];
        indicatori.forEach(i=>{
            const item=document.createElement("option");
            item.value=i.value;
            item.textContent=i.text;
            selector_indicator.appendChild(item);
        });

        //valoarea default selectata in dropdown inainte ca utilizatorul sa aleaga alta optiune
        selector_tara.selectedIndex=0;
        selector_indicator.selectedIndex=0;
        selector_ani.selectedIndex=0;
    }
    else{
        console.error("Nu s-au putut prelua denumirile");
    }
}

// 2.Afișare grafică evoluție pentru un indicator (PIB/SV/Pop) și o țară selectată de către utilizator 
// se va folosi un element de tip SVG (grafică vectorială)

const svg=document.getElementById("grafic_dreptunghi");
var x_grafic=0;
var y_grafic=0;
var width_grafic=svg.getAttribute("width");
//var height_grafic=svg.getAttribute("height");
var height_grafic=400;
//desenare dreptunghi pentru grafic
function deseneazaDreptunghi(x,y,w,h,svg){
    dreptunghi = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    dreptunghi.setAttributeNS(null, "x", x);
    dreptunghi.setAttributeNS(null, "y", y);
    dreptunghi.setAttributeNS(null, "width",w); 
    dreptunghi.setAttributeNS(null, "height",h);
    svg.appendChild(dreptunghi);
}
deseneazaDreptunghi(x_grafic,y_grafic,width_grafic,height_grafic,svg);

//Preiau valoarea aleasa de utilizator, iar dupa asociez evenimentul de schimbare a optiunii "change" cu functiile alege_tara/alege_indicator
selector_tara=document.getElementById("tara");
selector_indicator=document.getElementById("indicator");
var tara_selectata;
var indicator_selectat;
var an_valoare;//toate valorile pe parcursul celor 15 ani pentru tara si indicatorul ales

//Functie care se declanseaza cand utilizatorul alege o tara din lista
function alege_tara(event)
{
    tara_selectata=event.target.value;//preiau valoarea (tara) de la elementul HTML care a declansat evenimentul
    if(indicator_selectat===undefined)//daca utilizatorul a selectat doar tara, nu si indicatorul
    {
        indicator_selectat=selector_indicator.value;//valoare default in cazul in care utilizatorul nu alege un indicator
    }
    if(indicator_selectat==="PIB")
        {
            const date_selectate=PIB.filter(element=>{
                return element.tara===tara_selectata && element.indicator===indicator_selectat
            });
             an_valoare=date_selectate.map(element=>(
                {an:element.an, valoare:element.valoare} 
            ));
        }
        else  if(indicator_selectat==="SV")
        {
            const date_selectate=SV.filter(element=>{
                return element.tara===tara_selectata && element.indicator===indicator_selectat
            });
             an_valoare=date_selectate.map(element=>(
                {an:element.an, valoare:element.valoare} 
            ));
        }else if(indicator_selectat==="Pop"){
            const date_selectate=Pop.filter(element=>{
                return element.tara===tara_selectata && element.indicator===indicator_selectat
            });
             an_valoare=date_selectate.map(element=>(
                {an:element.an, valoare:element.valoare} 
            ));
        }
    deseneaza_bare("rgb(191, 86, 104)","black");
}

//Functie care se declanseaza cand utilizatorul alege un indicator din lista
function alege_indicator(event)
{
    if(tara_selectata===undefined)//daca utilizatorul a selectat doar indicatorul, nu si tara
    {
        tara_selectata=selector_tara.value;
    }
    indicator_selectat=event.target.value;
     if(indicator_selectat==="PIB")
    {
        const date_selectate=PIB.filter(element=>{
            return element.tara===tara_selectata && element.indicator===indicator_selectat
        });
         an_valoare=date_selectate.map(element=>(
            {an:element.an, valoare:element.valoare} 
        ));
    }
    else  if(indicator_selectat==="SV")
    {
        const date_selectate=SV.filter(element=>{
            return element.tara===tara_selectata && element.indicator===indicator_selectat
        });
         an_valoare=date_selectate.map(element=>(
            {an:element.an, valoare:element.valoare} 
        ));
    }else if(indicator_selectat==="Pop"){
        const date_selectate=Pop.filter(element=>{
            return element.tara===tara_selectata && element.indicator===indicator_selectat
        });
         an_valoare=date_selectate.map(element=>(
            {an:element.an, valoare:element.valoare} 
        ));
    }

    console.log(tara_selectata);
    console.log(indicator_selectat);
    console.log(an_valoare);
    deseneaza_bare("rgb(191, 86, 104)","black");
}
selector_tara.addEventListener("change",alege_tara);
selector_indicator.addEventListener("change",alege_indicator);

//Curatam graficul
function elibereaza_svg(svg_element)
{
    while(svg_element.firstChild)
    {
        svg_element.removeChild(svg_element.firstChild);
    }
}

// 3.Pentru grafic să se afișeze un tooltip care să afișeze anul și valorile pentru PIB/SV/Pop pentru perioada corespunzătoare poziției mouse-ului 
const tooltip=document.getElementById("tooltip");
function adauga_eveniment_mouse(bara, i,vector_valori,vector_ani)
{
    //adaug evenimentele pentru mouse (tooltip)
    //cand mouse-ul este peste bara
    bara.addEventListener("mouseover",()=>{
        tooltip.style.display="block";//fac vizibil tooltip-ul
        tooltip.textContent=`Valoarea indicatorului este ${vector_valori[i]} pentru anul ${vector_ani[i]}`;
    });

    //cand mouse-ul se misca in zona unei coloane
    bara.addEventListener("mousemove",(e)=>{
       const x_tooltip=e.clientX;//pozitia mouse-ului pe axa x fata de marginea din stanga a browserului
       const y_tooltip=e.clientY;//pozitia mouse-ului pe axa y fata de marginea din sus a browserului
       tooltip.style.left=x_tooltip+5+"px";//mut tooltip-ul pe pozitia calculata, putin mai indepartat de mouse
       tooltip.style.top=y_tooltip+5+"px";
    });

    //cand mouse-ul este in afara oricarei coloane
    bara.addEventListener("mouseout",()=>{
        tooltip.style.display="none";
    });
}
//desenam barele din histograma conform valorilor indicatorului ales
function deseneaza_bare(culoare_fill,culoare_stroke)
{
    elibereaza_svg(svg);
    deseneazaDreptunghi(x_grafic,y_grafic,width_grafic,height_grafic,svg);
    const vector_ani=an_valoare.map(valoare=>valoare.an);
    const vector_valori=an_valoare.map(element=>element.valoare);
    if(vector_valori.length===0)
    {
        const text=document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttributeNS(null,"x",svg.getAttribute("width")/2);
        text.setAttributeNS(null,"y",svg.getAttribute("height")/2);
        text.setAttributeNS(null,"fill","black");
        text.setAttributeNS(null,"text-anchor","middle");
        text.setAttributeNS(null,"font-size","24");
        text.textContent="Nu exista date"
        svg.appendChild(text);
        return;
    }
    const latime_bara=width_grafic/vector_valori.length;
    //calculam proportia
    var p= height_grafic*0.7/Math.max.apply(Math,vector_valori);
    
    for(var i=0;i<vector_valori.length;i++)
    {
        //desenez fiecare bara
        const x=(i+0.1)*latime_bara;
        const y=height_grafic-vector_valori[i]*p;
        const w=0.6*latime_bara;
        const h=vector_valori[i]*p;

        const bara = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bara.setAttributeNS(null, "x", x);
        bara.setAttributeNS(null, "y", y);
        bara.setAttributeNS(null, "width", w);
        bara.setAttributeNS(null, "height", h);
        bara.setAttributeNS(null,"fill",culoare_fill);
        bara.setAttributeNS(null,"stroke",culoare_stroke);
        adauga_eveniment_mouse(bara, i,vector_valori,vector_ani);
        svg.appendChild(bara);

        //desenez valorile deasupra fiecarei coloane
        const valoare = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valoare.setAttributeNS(null, "x", x+w/2+2);
        valoare.setAttributeNS(null, "y", y-6);
        valoare.setAttributeNS(null,"text-anchor","middle");
        valoare.setAttributeNS(null,"font-size","12");
        valoare.textContent=vector_valori[i];
        svg.appendChild(valoare);

        //desenez anii sub fiecare coloana
        const an = document.createElementNS("http://www.w3.org/2000/svg", "text");
        an.setAttributeNS(null, "x", x+w/2);
        an.setAttributeNS(null, "y", height_grafic+20);
        an.setAttributeNS(null,"text-anchor","middle");
        an.setAttributeNS(null,"font-size","14");
        an.textContent=vector_ani[i];
        svg.appendChild(an);

        //desenez titlul graficului
        const titlul = document.createElementNS("http://www.w3.org/2000/svg", "text");
        titlul.setAttributeNS(null, "x", width_grafic/2);
        titlul.setAttributeNS(null, "y", height_grafic-370);
        titlul.setAttributeNS(null,"text-anchor","middle");
        titlul.setAttributeNS(null,"font-size","25");
        titlul.textContent="Distributia indicatorului pe ani";
        svg.appendChild(titlul);
    }
    //adaug legenda
    const d = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    d.setAttributeNS(null, "x", latime_bara);
    d.setAttributeNS(null, "y", height_grafic+40);
    d.setAttributeNS(null, "width",15); 
    d.setAttributeNS(null, "height",15);
    d.setAttributeNS(null,"fill","rgb(191, 86, 104)");
    svg.appendChild(d);

     //adaug legenda
     const text_legenda = document.createElementNS("http://www.w3.org/2000/svg", "text");
     text_legenda.setAttributeNS(null, "x", latime_bara+20);
     text_legenda.setAttributeNS(null, "y", height_grafic+52);
     text_legenda.setAttributeNS(null,"font-size","15");
     text_legenda.textContent="Valorile indicatorului";
     svg.appendChild(text_legenda);
}

//Creez un dropdown cu valorile anilor din 2009 pana in 2023
const selector_ani=document.getElementById("an_selectat");
function creaza_lista_ani()
{
    for(let i=2009;i<=2023;i++)
    {
        const item=document.createElement("option");
        item.value=i;
        item.textContent=i;
        selector_ani.appendChild(item);
    }         
}
creaza_lista_ani();

var an_selectat;
//Preiau anul selectat de utilizator
function preia_an(event)
{
    //an selectat
    an_selectat=event.target.value;
    creeaza_tabel(an_selectat);
    creeaza_legenda_tabel();
    creeaza_bubbleChart(an_selectat);
}
selector_ani.addEventListener("change",preia_an);

//6. Afișare sub formă de tabel a datelor disponibile pentru un an selectat de către utilizator 
// (tarile pe linii și cei trei indicatori pe coloană); 
// fiecare celulă va primi o culoare (de la roșu la verde) în funcție de distanța față de media uniunii 
const container=document.getElementById("tabel");

let medie_pib;//mediile indicatorilor in anul ales
let medie_sv;
let medie_pop;

let valori_an_selectat_pib;//valorile indicatorilor pentru anul ales
let valori_an_selectat_sv;
let valori_an_selectat_pop;

function creeaza_tabel(an)
{
    container.innerHTML="";//golesc tabelul la fiecare apel al functiei
    if(an===undefined)
        {
            an=selector_ani.value;//an default 2009
        }
    //Preiau datele despre fiecare indicator in anul ales
    const date_selectate_pib=PIB.filter(element=>{
        return element.an===an;
    });
     valori_an_selectat_pib=date_selectate_pib.map(element=>(
        {tara:element.tara, valoare:element.valoare} 
    ));

    const date_selectate_sv=SV.filter(element=>{
        return element.an===an;
    });
     valori_an_selectat_sv=date_selectate_sv.map(element=>(
        {tara:element.tara, valoare:element.valoare} 
    ));
    const date_selectate_pop=Pop.filter(element=>{
        return element.an===an;
    });
     valori_an_selectat_pop=date_selectate_pop.map(element=>(
        {tara:element.tara, valoare:element.valoare} 
    ));

    //calculez media pentru fiecare indicator in anul ales
    const medie_valori_pib_vector=valori_an_selectat_pib.map(element=>element.valoare);//creez un vector cu valorile PIB pentru a calcula media
    medie_pib=0;
    for(let i=0;i<medie_valori_pib_vector.length;i++)
    {
        medie_pib+=medie_valori_pib_vector[i];
    }
    medie_pib/=medie_valori_pib_vector.length;
    console.log("Media PIB:",medie_pib);

    const medie_valori_sv_vector=valori_an_selectat_sv.map(element=>element.valoare);//creez un vector cu valorile SV pentru a calcula media
    medie_sv=0;
    for(let i=0;i<medie_valori_sv_vector.length;i++)
    {
        medie_sv+=medie_valori_sv_vector[i];
    }
    medie_sv/=medie_valori_sv_vector.length;
    console.log("Media Speranta de viata:",medie_sv);

    const medie_valori_pop_vector=valori_an_selectat_pop.map(element=>element.valoare);//creez un vector cu valorile Pop pentru a calcula media
    medie_pop=0;
    for(let i=0;i<medie_valori_pop_vector.length;i++)
    {
        medie_pop+=medie_valori_pop_vector[i];
    }
    medie_pop/=medie_valori_pop_vector.length;
    console.log("Media populatie:",medie_pop);

    //construiesc tabelul
    const tabel=document.createElement("table");

    //construiect titlul
    const titlul=document.createElement("tr");
    titlul.innerHTML=`<th>Țara</th><th>PIB</th><th>SV</th><th>Pop</th>`;
    tabel.appendChild(titlul);

    tari_anSelectat=valori_an_selectat_pop.map(element=>element.tara);
    for(let i=0;i<tari_anSelectat.length;i++)
    {
        //pe prima coloana adaug denumirile tarilor
       const rand=document.createElement("tr");
       const celula_tara=document.createElement("td");
       celula_tara.textContent=tari_anSelectat[i];
       celula_tara.style.backgroundColor="white";
       rand.appendChild(celula_tara);

       //adaug valorile indicatorilor pe fiecare rand
       const valori_rand=[medie_valori_pib_vector[i],medie_valori_sv_vector[i],medie_valori_pop_vector[i]];
       valori_rand.forEach((val,index)=>{
       const celula=document.createElement("td");
       celula.textContent=val;

        if(index===0)//pentru valorile PIB apelez functia pentru gasirea culorii
        {
            celula.style.backgroundColor=alege_culoare(val,medie_pib);
        }else if(index===1)//pentru valorile Sperantei de viata apelez functia pentru gasirea culorii
        {
            celula.style.backgroundColor=alege_culoare(val,medie_sv);
        }else if(index===2)//pentru valorile Populatiei apelez functia pentru gasirea culorii
        {
            celula.style.backgroundColor=alege_culoare(val,medie_pop);
        }
        rand.appendChild(celula);//adaug fiecare celula pe randul creat
       });
       tabel.appendChild(rand);//adaug randul in tabel
    }
    container.appendChild(tabel);
}

//Functia care seteaza culoarea indicatorilor din tabel
function alege_culoare(valoare,medie)
{
    if(valoare===undefined)//in anul ales, exista valori lipsa acestea se vor afisa cu gri
    {
        return `rgb(100,100,100)`;
    }
    let diferenta=medie/valoare; //valoare=media ==> diferenta=1  valoare<media ==> diferenta>1  valoare>media ==> diferenta<1
    if(diferenta>1)//valori < media
    {
        diferenta=Math.min(1,1/diferenta);//normalizam spre valoarea 1
    }
    else{
        diferenta=Math.min(1,diferenta);//normalizam spre valoarea 1
    }
    //Cu cat diferenta este mai apropiata de 1 (valoare apropiata de medie)cu atat culoarea este mai puternic spre verde si mai putin spre rosu
    const rosu=Math.round(255*(1-diferenta));
    const verde=Math.round(255*diferenta);
    return `rgb(${rosu},${verde},0)`;
}

//Legenda pentru tabel
const svg_tabel=document.getElementById("legenda_tabel");
function creeaza_legenda_tabel(){
    elibereaza_svg(svg_tabel);
    const legenda=[
        {
            culoare:"rgb(0,255,0)", mesaj:"Indicatorul are valoarea aproape de medie"
        },{
             culoare:"rgb(255,0,0)", mesaj:"Indicatorul are valoarea departe de medie"
        },{
             culoare:"rgb(100,100,100)", mesaj:"Valori lipsă"
        }];
    legenda.forEach((element,index)=>{
        const dreptunghi=document.createElementNS("http://www.w3.org/2000/svg", "rect");
        dreptunghi.setAttributeNS(null, "x", 20);
        dreptunghi.setAttributeNS(null, "y", 15+index*30);
        dreptunghi.setAttributeNS(null, "width", 10);
        dreptunghi.setAttributeNS(null, "height", 10);
        dreptunghi.setAttributeNS(null, "fill", element.culoare);
        svg_tabel.appendChild(dreptunghi);

        const text_legenda_tabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text_legenda_tabel.setAttributeNS(null, "x", 40);
        text_legenda_tabel.setAttributeNS(null, "y", 25+index*30);
        text_legenda_tabel.setAttributeNS(null,"font-size","15");
        text_legenda_tabel.setAttributeNS(null, "fill", "black");
        text_legenda_tabel.textContent=element.mesaj;
        svg_tabel.appendChild(text_legenda_tabel);
    });
    const medie_legenda = document.createElementNS("http://www.w3.org/2000/svg", "text");
    medie_legenda.setAttributeNS(null, "x", 20);
    medie_legenda.setAttributeNS(null, "y", 120);
    medie_legenda.setAttributeNS(null,"font-size","15");
    medie_legenda.setAttributeNS(null, "fill", "black");
    medie_legenda.textContent=`Media PIB-ului: ${medie_pib} / Media Speranței de viață:${medie_sv} / Media populație:${medie_pop}`;
    svg_tabel.appendChild(medie_legenda);
}

//4. Afișare bubble chart pentru un an selectat de utilizator folosind un element de tip canvas 
const canvas=document.getElementById("bubbleChart");
const context=canvas.getContext("2d");

//Fiecare cerc va avea dimensiunea in functie de valoarea PIB-ului, se va aseza pe axa X in functie de valoarea Populatiei si pe axa Y in functie de speranta de viata
function creeaza_bubbleChart(an)
{
    if(an===undefined)
        {
            an=selector_ani.value;//an default 2009
        }
        //Preiau datele despre fiecare indicator in anul ales
        const date_selectate_pib=PIB.filter(element=>{
            return element.an===String(an);
        });
        valori_an_selectat_pib=date_selectate_pib.map(element=>(
            {tara:element.tara, valoare:element.valoare} 
        ));

        const date_selectate_sv=SV.filter(element=>{
            return element.an===String(an);
        });
        valori_an_selectat_sv=date_selectate_sv.map(element=>(
            {tara:element.tara, valoare:element.valoare} 
        ));
        const date_selectate_pop=Pop.filter(element=>{
            return element.an===String(an);
        });
        valori_an_selectat_pop=date_selectate_pop.map(element=>(
            {tara:element.tara, valoare:element.valoare} 
        ));

        //calculez media pentru fiecare indicator in anul ales
        const medie_valori_pib_vector=valori_an_selectat_pib.map(element=>element.valoare);//creez un vector cu valorile PIB pentru a calcula media
        medie_pib=0;
        for(let i=0;i<medie_valori_pib_vector.length;i++)
        {
            medie_pib+=medie_valori_pib_vector[i];
        }
        medie_pib/=medie_valori_pib_vector.length;
       
        const medie_valori_sv_vector=valori_an_selectat_sv.map(element=>element.valoare);//creez un vector cu valorile SV pentru a calcula media
        medie_sv=0;
        for(let i=0;i<medie_valori_sv_vector.length;i++)
        {
            medie_sv+=medie_valori_sv_vector[i];
        }
        medie_sv/=medie_valori_sv_vector.length;
  
        const medie_valori_pop_vector=valori_an_selectat_pop.map(element=>element.valoare);//creez un vector cu valorile Pop pentru a calcula media
        medie_pop=0;
        for(let i=0;i<medie_valori_pop_vector.length;i++)
        {
            medie_pop+=medie_valori_pop_vector[i];
        }
        medie_pop/=medie_valori_pop_vector.length;
    
        context.clearRect(0,0,canvas.width,canvas.height);
        
        context.font="8px Verdana";
        context.fillStyle="black";
        context.strokeStyle="black";
        context.textAlign="center"
        context.fillText("Analiza indicatorilor pe ani",canvas.width/2,canvas.height-canvas.height*0.9);

        //Calculez valoarea maxima pentru fiecare indicator
        const maxPib=Math.max(...valori_an_selectat_pib.map(val=>val.valoare));
        const maxSv=Math.max(...valori_an_selectat_sv.map(val=>val.valoare));
        const maxPop=Math.max(...valori_an_selectat_pop.map(val=>val.valoare));
    
        if(valori_an_selectat_pib.length!==0 && valori_an_selectat_pop.length!==0 && valori_an_selectat_sv.length!==0)
        {
              //Desenez cercurile corespunzatoare tarilor
            for(let i=0;i<valori_an_selectat_pib.length;i++)
            {
                const x=(canvas.width/valori_an_selectat_pib.length)+i*10;
                const y=canvas.height-(valori_an_selectat_pop[i].valoare/maxPop)*(canvas.height*0.5)-40;
                const raza=(valori_an_selectat_pib[i].valoare/maxPib)*20;//cercul devine mai mic daca valoare PIB-ului este mica
        
                context.beginPath();
                context.arc(x,y,raza,0,2*Math.PI);
                if(valori_an_selectat_sv[i].valoare===maxSv)//tarile cu cele mai mari valori ale Sperantei de viata 
                {
                    context.fillStyle=`rgba(73, 2, 14, 0.7)`;
                }else  if(valori_an_selectat_sv[i].valoare>medie_sv){ //tarile cu valori ale Sperantei de viata mai mari decat media SV
                    context.fillStyle=`rgba(247, 177, 190, 0.7)`;
                }else if(valori_an_selectat_sv[i].valoare<medie_sv){ //tarile cu valori ale Sperantei de viata mai mici decat media SV
                    context.fillStyle=`rgba(237, 49, 80, 0.7)`;
                }
                context.fill();
        
                context.font="7px Verdana";
                context.fillStyle="black";
                context.fillText(valori_an_selectat_pop[i].tara,x-raza/2,y-raza/2-3);
            }    
        }
    else{
        context.font="10px Verdana";
        context.fillStyle="black";
        context.textAlign="center";
        context.fillText("Lipsesc valori !",canvas.width/2,canvas.height/2);
    }

}

//Desenez legenda pentru bubbleChart
const svg_bubbleChart=document.getElementById("legenda_bubbleChart");
function creeaza_legenda_bubbleChart(){
    elibereaza_svg(svg_bubbleChart);
    const legenda=[
        {
            culoare:"rgba(73, 2, 14, 0.7)", mesaj:"Țările cu valoarea maximă a Sperantei de viață"
        },{
             culoare:"rgba(247, 177, 190, 0.7)", mesaj:"Țările cu valori ale Speranței de viață mai mari decât media SV"
        },{
             culoare:"rgba(237, 49, 80, 0.7)", mesaj:"Țările cu valori ale Speranței de viață mai mici decât media SV"
        }];
    legenda.forEach((element,index)=>{
        const dreptunghi=document.createElementNS("http://www.w3.org/2000/svg", "rect");
        dreptunghi.setAttributeNS(null, "x", 20);
        dreptunghi.setAttributeNS(null, "y", 15+index*30);
        dreptunghi.setAttributeNS(null, "width", 10);
        dreptunghi.setAttributeNS(null, "height", 10);
        dreptunghi.setAttributeNS(null, "fill", element.culoare);
        svg_bubbleChart.appendChild(dreptunghi);

        const text_legenda_tabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text_legenda_tabel.setAttributeNS(null, "x", 40);
        text_legenda_tabel.setAttributeNS(null, "y", 25+index*30);
        text_legenda_tabel.setAttributeNS(null,"font-size","15");
        text_legenda_tabel.setAttributeNS(null, "fill", "black");
        text_legenda_tabel.textContent=element.mesaj;
        svg_bubbleChart.appendChild(text_legenda_tabel);
    });
    const medie_legenda = document.createElementNS("http://www.w3.org/2000/svg", "text");
    medie_legenda.setAttributeNS(null, "x", 20);
    medie_legenda.setAttributeNS(null, "y", 120);
    medie_legenda.setAttributeNS(null,"font-size","15");
    medie_legenda.setAttributeNS(null, "fill", "black");
    medie_legenda.textContent="Dimensiunea cercului crește odată cu valoarea PIB-ului";
    svg_bubbleChart.appendChild(medie_legenda);

    const legenta_populatie = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legenta_populatie.setAttributeNS(null, "x", 20);
    legenta_populatie.setAttributeNS(null, "y", 150);
    legenta_populatie.setAttributeNS(null,"font-size","15");
    legenta_populatie.setAttributeNS(null, "fill", "black");
    legenta_populatie.textContent="Cercurile poziționate în partea de sus a graficului reprezintă țările cu valoarea populației mai mare și invers.";
    svg_bubbleChart.appendChild(legenta_populatie);

    const legenta_populatie_2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    legenta_populatie_2.setAttributeNS(null, "x", 20);
    legenta_populatie_2.setAttributeNS(null, "y", 180);
    legenta_populatie_2.setAttributeNS(null,"font-size","15");
    legenta_populatie_2.setAttributeNS(null, "fill", "black");
    legenta_populatie_2.textContent="Poziția verticală este proporțională cu valoarea populației fiecărei țări.";
    svg_bubbleChart.appendChild(legenta_populatie_2);
}

//5. Animație bubble chart (afișare bubble chart succesiv pentru toți anii) 
let index=0;
function animatie_bubbleChart()
{
    index=0;
    let lista_ani=[];
    for(let i=2009;i<=2023;i++)
        {
            lista_ani.push(i);
        }   
    //ne vom folosi de index pentru a parcurge lista de ani, iar in fiecare secunda se va executa functia de creare a bubbleChart-ului pentru anul specific din lista
    const durata=setInterval(()=>{
        if(index>=lista_ani.length)
            {
                clearInterval(durata);//oprim animatia
                return;
            }
        context.clearRect(0,0,canvas.width,canvas.height);//curatam la fiecare iteratie canvasul
        const curent = Number(lista_ani[index]);
        creeaza_bubbleChart(curent);
        index++;
    },1000);
}
const buton=document.getElementById("buton_animatie").addEventListener("click",animatie_bubbleChart);