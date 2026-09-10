function toggleMenu(){
  const n=document.getElementById('navLinks');
  n.style.display=n.style.display==='flex'?'none':'flex';
}

let currentMapLink = '';

const locationBtn = document.getElementById('locationBtn');
if(locationBtn){
  locationBtn.addEventListener('click', function(){
    const status=document.getElementById('locationStatus');
    const btn=this;
    if(!navigator.geolocation){
      status.textContent='Location is not supported by this browser.';
      return;
    }
    btn.disabled=true;
    status.textContent='Getting your location...';
    navigator.geolocation.getCurrentPosition(
      function(position){
        const lat=position.coords.latitude;
        const lon=position.coords.longitude;
        currentMapLink=`https://www.google.com/maps?q=${lat},${lon}`;
        const mapInput=document.getElementById('mapLocation');
        if(mapInput) mapInput.value=currentMapLink;
        status.textContent='✓ Current location added';
        btn.disabled=false;
      },
      function(){
        status.textContent='Location permission denied. Please enter address manually.';
        btn.disabled=false;
      },
      {enableHighAccuracy:true, timeout:10000, maximumAge:0}
    );
  });
}

document.getElementById('bookingForm').addEventListener('submit',function(e){
  e.preventDefault();
  const name=document.getElementById('name').value.trim();
  const mobile=document.getElementById('mobile').value.trim();
  const service=document.getElementById('service').value;
  const date=document.getElementById('date').value || 'Not specified';
  const address=document.getElementById('address').value.trim();
  const problem=document.getElementById('problem').value.trim() || 'Not specified';
  const locationLine=currentMapLink ? `Google Maps Location: ${currentMapLink}` : 'Google Maps Location: Not shared';
  const message=['Hello NA Plumber Service, I want to book a plumbing service.','',`Name: ${name}`,`Mobile: ${mobile}`,`Service: ${service}`,`Preferred Date: ${date}`,`Location/Address: ${address}`,locationLine,`Problem: ${problem}`].join('\n');
  window.open(`https://wa.me/919059991545?text=${encodeURIComponent(message)}`,'_blank');
});
document.querySelectorAll('.quick-card').forEach(function(card){
  card.addEventListener('click',function(){
    const service=this.dataset.service;
    const select=document.getElementById('service');
    const booking=document.getElementById('booking');
    const box=document.getElementById('urgencyBox');
    if(select){ select.value=service; }
    if(box){
      box.innerHTML = service === 'Emergency Plumbing'
        ? '<strong>🚨 Emergency selected:</strong> Add your location and problem details, then send the request on WhatsApp.'
        : '<strong>✓ '+service+' selected.</strong> Add your details below and send the booking request.';
    }
    if(booking){ booking.scrollIntoView({behavior:'smooth'}); }
  });
});

(function(){const fields=['name','service','date','address'];const ids={name:'previewName',service:'previewService',date:'previewDate',address:'previewAddress'};fields.forEach(function(id){const el=document.getElementById(id);if(el){el.addEventListener('input',update);el.addEventListener('change',update)}});const d=document.getElementById('date');if(d){const x=new Date();const y=new Date(x.getTime()-x.getTimezoneOffset()*60000);d.min=y.toISOString().slice(0,10)}function update(){fields.forEach(function(id){const el=document.getElementById(id),t=document.getElementById(ids[id]);if(el&&t)t.textContent=el.value.trim()||({name:'Name',service:'Service',date:'Date',address:'Location'}[id])})}})();
