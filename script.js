(function(){
  function loadSupabase(){
    return new Promise(function(resolve,reject){
      if(window.supabase) return resolve();
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  loadSupabase().then(init).catch(function(){
    console.error('Could not load Supabase client.');
  });

  function init(){
    const supabaseClient=window.supabase.createClient(
      window.NA_SUPABASE_URL,
      window.NA_SUPABASE_PUBLISHABLE_KEY
    );

    window.toggleMenu=function(){
      const n=document.getElementById('navLinks');
      if(n) n.style.display=n.style.display==='flex'?'none':'flex';
    };

    let currentMapLink='';
    const locationBtn=document.getElementById('locationBtn');
    if(locationBtn){
      locationBtn.addEventListener('click',function(){
        const status=document.getElementById('locationStatus');
        const btn=this;
        if(!navigator.geolocation){if(status)status.textContent='Location is not supported by this browser.';return;}
        btn.disabled=true;
        if(status)status.textContent='Getting your location...';
        navigator.geolocation.getCurrentPosition(function(position){
          const lat=position.coords.latitude;
          const lon=position.coords.longitude;
          currentMapLink=`https://www.google.com/maps?q=${lat},${lon}`;
          const mapInput=document.getElementById('mapLocation');
          if(mapInput)mapInput.value=currentMapLink;
          if(status)status.textContent='✓ Current location added';
          btn.disabled=false;
        },function(){
          if(status)status.textContent='Location permission denied. Please enter address manually.';
          btn.disabled=false;
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
        const address=document.getElementById('address').value.trim();
        const problem=document.getElementById('problem').value.trim()||'Not specified';
        const mapLocation=(document.getElementById('mapLocation')||{}).value||currentMapLink||null;
        let status=document.getElementById('bookingStatus');
        if(!status){
          status=document.createElement('div');
          status.id='bookingStatus';
          status.style.marginTop='10px';
          status.style.fontWeight='700';
          bookingForm.appendChild(status);
        }
        if(!name||!mobile||!service||!address){status.textContent='Please fill all required details.';return;}
        if(button)button.disabled=true;
        status.textContent='Saving your booking...';

        const {error}=await supabaseClient.from('bookings').insert({
          customer_name:name,
          phone:mobile,
          service:service,
          address:address,
          problem:problem,
          booking_date:date,
          map_location:mapLocation,
          status:'Pending'
        });

        if(error){
          console.error('Supabase booking error:',error);
          status.textContent='Booking could not be saved. Please try again or use WhatsApp directly.';
          if(button)button.disabled=false;
          return;
        }

        const locationLine=mapLocation?`Google Maps Location: ${mapLocation}`:'Google Maps Location: Not shared';
        const message=['Hello NA Plumber Service, I want to book a plumbing service.','',`Name: ${name}`,`Mobile: ${mobile}`,`Service: ${service}`,`Preferred Date: ${date||'Not specified'}`,`Location/Address: ${address}`,locationLine,`Problem: ${problem}`].join('\n');
        status.textContent='✓ Booking saved. Opening WhatsApp...';
        window.open(`https://wa.me/919059991545?text=${encodeURIComponent(message)}`,'_blank');
        bookingForm.reset();
        currentMapLink='';
        const locationStatus=document.getElementById('locationStatus');
        if(locationStatus)locationStatus.textContent='Or enter your address manually.';
        if(button)button.disabled=false;
      });
    }

    document.querySelectorAll('.quick-card').forEach(function(card){
      card.addEventListener('click',function(){
        const service=this.dataset.service;
        const select=document.getElementById('service');
        const booking=document.getElementById('booking');
        const box=document.getElementById('urgencyBox');
        if(select)select.value=service;
        if(box)box.innerHTML=service==='Emergency Plumbing'?'<strong>🚨 Emergency selected:</strong> Add your location and problem details, then send the request on WhatsApp.':'<strong>✓ '+service+' selected.</strong> Add your details below and send the booking request.';
        if(booking)booking.scrollIntoView({behavior:'smooth'});
      });
    });

    (function(){
      const fields=['name','service','date','address'];
      const ids={name:'previewName',service:'previewService',date:'previewDate',address:'previewAddress'};
      fields.forEach(function(id){const el=document.getElementById(id);if(el){el.addEventListener('input',update);el.addEventListener('change',update);}});
      const d=document.getElementById('date');
      if(d){const x=new Date();const y=new Date(x.getTime()-x.getTimezoneOffset()*60000);d.min=y.toISOString().slice(0,10);}
      function update(){fields.forEach(function(id){const el=document.getElementById(id),t=document.getElementById(ids[id]);if(el&&t)t.textContent=el.value.trim()||({name:'Name',service:'Service',date:'Date',address:'Location'}[id]);});}
    })();
  }
})();
