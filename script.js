(function(){
  'use strict';
  const supabaseClient = window.supabase.createClient(window.NA_SUPABASE_URL, window.NA_SUPABASE_PUBLISHABLE_KEY);

  window.toggleMenu = function(){
    const nav = document.getElementById('navLinks');
    if(nav) nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  };

  document.querySelectorAll('#navLinks a').forEach(function(link){
    link.addEventListener('click',function(){
      const nav=document.getElementById('navLinks');
      if(window.innerWidth<=520 && nav) nav.style.display='none';
    });
  });

  let currentMapLink = '';
  const locationBtn = document.getElementById('locationBtn');
  if(locationBtn){
    locationBtn.addEventListener('click', function(){
      const locationStatus = document.getElementById('locationStatus');
      if(!navigator.geolocation){ if(locationStatus) locationStatus.textContent='Location is not supported by this browser.'; return; }
      locationBtn.disabled=true;
      if(locationStatus) locationStatus.textContent='Getting your location...';
      navigator.geolocation.getCurrentPosition(function(position){
        const lat=position.coords.latitude, lon=position.coords.longitude;
        currentMapLink=`https://www.google.com/maps?q=${lat},${lon}`;
        const mapInput=document.getElementById('mapLocation');
        if(mapInput) mapInput.value=currentMapLink;
        if(locationStatus) locationStatus.textContent='✓ Current location added';
        locationBtn.disabled=false;
      },function(){
        if(locationStatus) locationStatus.textContent='Location permission denied. Please enter address manually.';
        locationBtn.disabled=false;
      },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    });
  }

  const bookingForm=document.getElementById('bookingForm');
  if(bookingForm){
    bookingForm.addEventListener('submit',async function(e){
      e.preventDefault();
      const button=bookingForm.querySelector('button[type="submit"]');
      const name=document.getElementById('name').value.trim();
      const mobile=document.getElementById('mobile').value.trim();
      const service=document.getElementById('service').value;
      const date=document.getElementById('date').value||null;
      const time=document.getElementById('time').value||null;
      const address=document.getElementById('address').value.trim();
      const problem=document.getElementById('problem').value.trim()||'Not specified';
      const status=document.getElementById('bookingStatus');
      const bookingRef='NA-'+Date.now().toString(36).toUpperCase();
      const photoInput=document.getElementById('problemPhoto');
      const photo=photoInput&&photoInput.files&&photoInput.files[0] ? photoInput.files[0] : null;
      if(photo && photo.size>5*1024*1024){ if(status){status.textContent='Please choose a photo smaller than 5 MB.';status.className='booking-status error-booking';} return; }
      const photoNote=photo ? `Problem Photo: ${photo.name} (attach it in WhatsApp after opening)` : 'Problem Photo: Not attached';
      const mapEl=document.getElementById('mapLocation');
      const mapLocation=(mapEl&&mapEl.value)||currentMapLink||null;
      if(!name||!mobile||!service||!address){ if(status){status.textContent='Please fill all required details.';status.className='booking-status error-booking';} return; }

      const message=['Hello NA Plumber Service, I want to book a plumbing service.','',`Booking ID: ${bookingRef}`,`Name: ${name}`,`Mobile: ${mobile}`,`Service: ${service}`,`Preferred Date: ${date||'Not specified'}`,`Preferred Time: ${time||'Not specified'}`,`Location/Address: ${address}`,mapLocation?`Google Maps Location: ${mapLocation}`:'Google Maps Location: Not shared',`Problem: ${problem}`,photoNote].join('\n');
      const whatsappUrl=`https://wa.me/919059991545?text=${encodeURIComponent(message)}`;
      if(button) button.disabled=true;
      if(status){status.textContent='Saving your booking...';status.className='booking-status';}

      const bookingData={customer_name:name,phone:mobile,service:service,address:address,problem:`[${bookingRef}] ${problem}`,booking_date:date,booking_time:time,map_location:mapLocation,status:'Pending'};
      try{
        let result=await supabaseClient.from('bookings').insert(bookingData);
        // Backward-compatible fallback: if the new booking_time column has not been added yet, save the booking without it.
        if(result.error && (result.error.code==='42703' || String(result.error.message||'').toLowerCase().includes('booking_time'))){
          const fallback={...bookingData};
          delete fallback.booking_time;
          result=await supabaseClient.from('bookings').insert(fallback);
        }
        if(result.error) throw result.error;
        if(status){status.innerHTML='✓ <strong>Booking saved successfully!</strong> Opening WhatsApp...';status.className='booking-status success-booking';}
        const refBox=document.getElementById('bookingRefBox'), refEl=document.getElementById('bookingRef');
        if(refBox&&refEl){refEl.textContent=bookingRef;refBox.style.display='block';localStorage.setItem('na_last_booking_id',bookingRef);}
        openWhatsApp(whatsappUrl,status);
        let waButton=document.getElementById('bookingWhatsappButton');
        if(!waButton){waButton=document.createElement('a');waButton.id='bookingWhatsappButton';waButton.target='_blank';waButton.rel='noopener';waButton.className='btn whatsapp full';waButton.style.marginTop='10px';bookingForm.appendChild(waButton);}
        waButton.href=whatsappUrl;waButton.textContent='💬 Open WhatsApp & Send Booking';waButton.style.display='block';
        bookingForm.reset();currentMapLink='';
        const locationStatus=document.getElementById('locationStatus');
        if(locationStatus) locationStatus.textContent='Search an area or enter your address.';
      }catch(error){
        console.error('Supabase booking error:',error);
        if(status){const detail=error&&(error.message||error.code)?` (${error.message||error.code})`:'';status.innerHTML=`⚠️ <strong>Booking database save failed.</strong>${detail}<br><small>WhatsApp booking is still available below.</small>`;status.className='booking-status error-booking';}
        let waButton=document.getElementById('bookingWhatsappButton');
        if(!waButton){waButton=document.createElement('a');waButton.id='bookingWhatsappButton';waButton.target='_blank';waButton.rel='noopener';waButton.className='btn whatsapp full';waButton.style.marginTop='10px';bookingForm.appendChild(waButton);}
        waButton.href=whatsappUrl;waButton.textContent='💬 Send Booking on WhatsApp Now';waButton.style.display='block';
      }finally{if(button) button.disabled=false;}
    });
  }

  function openWhatsApp(url,status){const popup=window.open(url,'_blank','noopener');if(!popup&&status) status.innerHTML='✓ <strong>Booking saved successfully!</strong> Click “Open WhatsApp & Send Booking” below.';}

  document.querySelectorAll('.quick-card').forEach(function(card){card.addEventListener('click',function(){const service=this.dataset.service,select=document.getElementById('service'),booking=document.getElementById('booking'),box=document.getElementById('urgencyBox');if(select)select.value=service;if(box)box.innerHTML=service==='Emergency Plumbing'?'<strong>🚨 Emergency selected:</strong> Add your location and problem details, then send the request on WhatsApp.':`<strong>✓ ${service} selected.</strong> Add your details below and send the booking request.`;if(booking)booking.scrollIntoView({behavior:'smooth'});});});

  (function(){
    const fields=['name','service','date','time','address'];
    const ids={name:'previewName',service:'previewService',date:'previewDate',time:'previewTime',address:'previewAddress'};
    const placeholders={name:'Name',service:'Service',date:'Date',time:'Time',address:'Location'};
    fields.forEach(function(id){const el=document.getElementById(id);if(el){el.addEventListener('input',updatePreview);el.addEventListener('change',updatePreview);}});
    const dateInput=document.getElementById('date');
    if(dateInput){const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);dateInput.min=local.toISOString().slice(0,10);}
    function updatePreview(){fields.forEach(function(id){const el=document.getElementById(id),target=document.getElementById(ids[id]);if(el&&target)target.textContent=el.value.trim()||placeholders[id];});}
  })();
  // Service price estimate (indicative; parts may be extra)
  (function(){
    const select=document.getElementById('service'), value=document.getElementById('estimateValue');
    const estimates={
      'Water Leakage Repair':'₹499–₹1,499', 'Tap & Faucet Repair':'₹299–₹999', 'Toilet Repair':'₹399–₹1,299',
      'Bathroom Fittings':'₹499–₹1,499', 'Geyser Plumbing':'₹499–₹1,499', 'Pipe Repair & Replacement':'₹499–₹1,999',
      'Emergency Plumbing':'₹699–₹2,499', 'Bathroom Plumbing':'₹499–₹1,499', 'Bathroom Renovation':'Get a custom quote',
      'AC Repairing':'Get a custom quote', 'Other':'Get a custom quote'
    };
    function updateEstimate(){ if(value) value.textContent=estimates[select?.value]||'Select a service'; }
    if(select){select.addEventListener('change',updateEstimate);updateEstimate();}
  })();

  // Dark / light mode with saved preference
  (function(){
    const btn=document.getElementById('themeToggle');
    const key='na_plumber_theme';
    function apply(mode){document.body.classList.toggle('dark-mode',mode==='dark');if(btn)btn.textContent=mode==='dark'?'☀️ Light':'🌙 Dark';}
    let saved=localStorage.getItem(key);
    if(saved!=='dark'&&saved!=='light') saved=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    apply(saved);
    if(btn)btn.addEventListener('click',function(){const next=document.body.classList.contains('dark-mode')?'light':'dark';localStorage.setItem(key,next);apply(next);});
  })();

})();
