(function(){
  'use strict';

  const supabaseClient = window.supabase.createClient(window.NA_SUPABASE_URL, window.NA_SUPABASE_PUBLISHABLE_KEY);

  window.toggleMenu = function(){
    const nav = document.getElementById('navLinks');
    if(nav) nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  };

  let currentMapLink = '';
  const locationBtn = document.getElementById('locationBtn');
  if(locationBtn){
    locationBtn.addEventListener('click', function(){
      const locationStatus = document.getElementById('locationStatus');
      if(!navigator.geolocation){
        if(locationStatus) locationStatus.textContent = 'Location is not supported by this browser.';
        return;
      }
      locationBtn.disabled = true;
      if(locationStatus) locationStatus.textContent = 'Getting your location...';
      navigator.geolocation.getCurrentPosition(function(position){
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        currentMapLink = `https://www.google.com/maps?q=${lat},${lon}`;
        const mapInput = document.getElementById('mapLocation');
        if(mapInput) mapInput.value = currentMapLink;
        if(locationStatus) locationStatus.textContent = '✓ Current location added';
        locationBtn.disabled = false;
      }, function(){
        if(locationStatus) locationStatus.textContent = 'Location permission denied. Please enter address manually.';
        locationBtn.disabled = false;
      }, {enableHighAccuracy:true, timeout:10000, maximumAge:0});
    });
  }

  const bookingForm = document.getElementById('bookingForm');
  if(bookingForm){
    bookingForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const button = bookingForm.querySelector('button[type="submit"]');
      const name = document.getElementById('name').value.trim();
      const mobile = document.getElementById('mobile').value.trim();
      const service = document.getElementById('service').value;
      const date = document.getElementById('date').value || null;
      const address = document.getElementById('address').value.trim();
      const problem = document.getElementById('problem').value.trim() || 'Not specified';
      const mapEl = document.getElementById('mapLocation');
      const mapLocation = (mapEl && mapEl.value) || currentMapLink || null;
      const status = document.getElementById('bookingStatus');

      if(!name || !mobile || !service || !address){
        if(status) status.textContent = 'Please fill all required details.';
        return;
      }

      if(button) button.disabled = true;
      if(status){ status.textContent = 'Saving your booking...'; status.className = 'booking-status'; }

      try{
        // Insert only. We intentionally do not call .select() here because public customers
        // should be allowed to create bookings without being allowed to read the table.
        const {error} = await supabaseClient.from('bookings').insert({
          customer_name: name,
          phone: mobile,
          service: service,
          address: address,
          problem: problem,
          booking_date: date,
          map_location: mapLocation,
          status: 'Pending'
        });
        if(error) throw error;

        const message = [
          'Hello NA Plumber Service, I want to book a plumbing service.',
          '',
          `Name: ${name}`,
          `Mobile: ${mobile}`,
          `Service: ${service}`,
          `Preferred Date: ${date || 'Not specified'}`,
          `Location/Address: ${address}`,
          mapLocation ? `Google Maps Location: ${mapLocation}` : 'Google Maps Location: Not shared',
          `Problem: ${problem}`
        ].join('\n');
        const whatsappUrl = `https://wa.me/919059991545?text=${encodeURIComponent(message)}`;

        if(status){
          status.innerHTML = '✓ <strong>Booking saved successfully!</strong> Your request is recorded. WhatsApp is ready below.';
          status.className = 'booking-status success-booking';
        }

        let waButton = document.getElementById('bookingWhatsappButton');
        if(!waButton){
          waButton = document.createElement('a');
          waButton.id = 'bookingWhatsappButton';
          waButton.target = '_blank';
          waButton.rel = 'noopener';
          waButton.className = 'btn whatsapp full';
          waButton.style.marginTop = '10px';
          bookingForm.appendChild(waButton);
        }
        waButton.href = whatsappUrl;
        waButton.textContent = '💬 Open WhatsApp & Send Booking';

        const popup = window.open(whatsappUrl, '_blank', 'noopener');
        if(!popup && status){
          status.innerHTML = '✓ <strong>Booking saved successfully!</strong> Click “Open WhatsApp & Send Booking” below.';
        }

        bookingForm.reset();
        currentMapLink = '';
        const locationStatus = document.getElementById('locationStatus');
        if(locationStatus) locationStatus.textContent = 'Or enter your address manually.';
        if(button) button.disabled = false;
      }catch(error){
        console.error('Supabase booking error:', error);
        if(status){
          status.textContent = 'Booking could not be saved. Please try again or use WhatsApp directly.';
          status.className = 'booking-status error-booking';
        }
        if(button) button.disabled = false;
      }
    });
  }

  document.querySelectorAll('.quick-card').forEach(function(card){
    card.addEventListener('click', function(){
      const service = this.dataset.service;
      const select = document.getElementById('service');
      const booking = document.getElementById('booking');
      const box = document.getElementById('urgencyBox');
      if(select) select.value = service;
      if(box) box.innerHTML = service === 'Emergency Plumbing'
        ? '<strong>🚨 Emergency selected:</strong> Add your location and problem details, then send the request on WhatsApp.'
        : `<strong>✓ ${service} selected.</strong> Add your details below and send the booking request.`;
      if(booking) booking.scrollIntoView({behavior:'smooth'});
    });
  });

  (function(){
    const fields = ['name','service','date','address'];
    const ids = {name:'previewName',service:'previewService',date:'previewDate',address:'previewAddress'};
    const placeholders = {name:'Name',service:'Service',date:'Date',address:'Location'};
    fields.forEach(function(id){
      const el = document.getElementById(id);
      if(el){ el.addEventListener('input', updatePreview); el.addEventListener('change', updatePreview); }
    });
    const dateInput = document.getElementById('date');
    if(dateInput){
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset()*60000);
      dateInput.min = local.toISOString().slice(0,10);
    }
    function updatePreview(){
      fields.forEach(function(id){
        const el = document.getElementById(id);
        const target = document.getElementById(ids[id]);
        if(el && target) target.textContent = el.value.trim() || placeholders[id];
      });
    }
  })();
})();
