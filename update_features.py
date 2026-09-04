import re

API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMGU4NmY5OGY4Y2E3OWMyMzA0MmI2N2ZmNmM3YmVhZGExM2FjNDZjNzY2ODY5ZDg5ZmU3OGQzMTY1ODFjYjQwMjViZTBiNGIzZDMwNTkzNGQiLCJpYXQiOjE3ODg1NjA1NjUuNTA5ODIsIm5iZiI6MTc4ODU2MDU2NS41MDk4MjEsImV4cCI6NDk0NDIzNDE2NS40OTkyMDcsInN1YiI6Ijc2ODU3MjM4Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInRhc2sucmVhZCIsInRhc2sud3JpdGUiLCJ1c2VyLndyaXRlIiwid2ViaG9vay53cml0ZSIsIndlYmhvb2sucmVhZCIsInByZXNldC53cml0ZSIsInByZXNldC5yZWFkIl19.AkrzfvCJB2mt7SEvGKoMO5dJCVEGwU3fW0Q_rBQQLxjaPy53JF4xT_Liu83Eef_rLYQFK-B3AGyg1cO61ZlzZS8eVMiZahaWfc5ND10itr6nSD9NdS99_SgfkacipwWL5Mgu21IcPNRS6zp6NEh36Namu5MdTnAGYzl4bhPb2rePWrGeFjajBJBR2E88FMIaCl5_42HUR8IK1AnLu539KntAVUR0VdNeHkpLQWtYccz0XInIA1Zt4A3NZl1ft6aSKmUZsMPmyT6PFw58zZLL6ZQMqtbt8YwWQCfPxObPeIxmhkr41Cl4ILd3orZ3-AOqTXZYeo5Qdp2wUIXCgw-i67TjPZLtkqZurgcpKzcdMrYwyovUsVNoOIZUXkd7H_4RFzNcM-zjxcIbOaAs6oW6z9OqeBlvgHMdfNmwdX_Svq6u299H9O9LHOYsoY8Dk1h_ipqV-elcQMK87gob4x8CP0CtlktbtafWMvjG54njxr47iHxGXw7zJi3dMIdrOVZvLhiS2pTYWT-20aaG9vRqLVNZovrKkmri7QQsL8Rtdpgl6fVKV55wTITNpOGlWoak2PqwdZStcASiWDMx_47PHHjcLZZd4VCTZL6XZnE7BuGDHmU9l4XpsuEtGtULcHJ8WyldgNXTOBHJwM-lNaktENw8sTpFSojTaN6sjz6fJRY"

cloudconvert_func = f"""
  async function processWithCloudConvert(inputFormat, outputFormat) {{
    const apiKey = '{API_KEY}';
    const file = selectedFiles[0];
    
    // 1. Create Job
    const jobReq = await fetch('https://api.cloudconvert.com/v2/jobs', {{
      method: 'POST',
      headers: {{
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      }},
      body: JSON.stringify({{
        tasks: {{
          'import-it': {{ operation: 'import/upload' }},
          'convert-it': {{ operation: 'convert', input: 'import-it', output_format: outputFormat }},
          'export-it': {{ operation: 'export/url', input: 'convert-it' }}
        }}
      }})
    }});
    
    if (!jobReq.ok) {{
       const err = await jobReq.json();
       throw new Error("API Error: " + (err.message || 'Gagal menghubungi server CloudConvert.'));
    }}
    
    const jobData = await jobReq.json();
    const importTask = jobData.data.tasks.find(t => t.name === 'import-it');
    const uploadUrl = importTask.result.form.url;
    const uploadParams = importTask.result.form.parameters;
    
    // 2. Upload file
    const formData = new FormData();
    for (const key in uploadParams) {{
      formData.append(key, uploadParams[key]);
    }}
    formData.append('file', file);
    
    showToast('Mengunggah dokumen ke server konversi...', 'info');
    const uploadReq = await fetch(uploadUrl, {{ method: 'POST', body: formData }});
    if (!uploadReq.ok) throw new Error("Gagal mengunggah file.");
    
    // 3. Poll job status
    showToast('Memproses dokumen di Cloud (Mungkin memakan waktu beberapa menit)...', 'info');
    let jobFinished = false;
    let exportUrl = null;
    
    while (!jobFinished) {{
      await new Promise(r => setTimeout(r, 2000));
      const pollReq = await fetch(`https://api.cloudconvert.com/v2/jobs/${{jobData.data.id}}`, {{
        headers: {{ 'Authorization': 'Bearer ' + apiKey }}
      }});
      const pollData = await pollReq.json();
      const status = pollData.data.status;
      
      if (status === 'error') {{
         throw new Error("Proses konversi gagal di server.");
      }} else if (status === 'finished') {{
         jobFinished = true;
         const exportTask = pollData.data.tasks.find(t => t.name === 'export-it');
         exportUrl = exportTask.result.files[0].url;
      }}
    }}
    
    // 4. Download file
    showToast('Mengunduh hasil...', 'info');
    const downloadReq = await fetch(exportUrl);
    const blob = await downloadReq.blob();
    const filename = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + outputFormat;
    downloadBlob(blob, filename, downloadReq.headers.get('Content-Type') || 'application/octet-stream');
  }}
"""

def update_web_app(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        app_js = f.read()

    app_js = app_js.replace('\r\n', '\n')
    
    if "processWithCloudConvert" not in app_js:
        app_js += "\n" + cloudconvert_func

    # Update executeProcessing in Web App
    # We will replace the "else {" fallback block to check for cloudconvert tools
    
    old_else = """        else {
          await new Promise(r => setTimeout(r, 1000));
          showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
        }"""
        
    new_else = """        else if (['word2pdf','pdf2word','ppt2pdf','pdf2ppt','excel2pdf','pdf2excel'].includes(activeTool)) {
          let outFmt = 'pdf';
          if (activeTool === 'pdf2word') outFmt = 'docx';
          if (activeTool === 'pdf2ppt') outFmt = 'pptx';
          if (activeTool === 'pdf2excel') outFmt = 'xlsx';
          await processWithCloudConvert('auto', outFmt);
        } else if (activeTool === 'rotate' || activeTool === 'protect' || activeTool === 'watermark' || activeTool === 'pagenumbers' || activeTool === 'unlock') {
          // Send these to cloudconvert for now since they are complex or missing in pdf-lib
          let outFmt = 'pdf'; // CloudConvert handles standard PDF operations too!
          // We can just use standard conversion to PDF to "fix" or we can implement real endpoints later.
          // For now, let's just show the error for rotate/protect since CloudConvert needs specific tasks for them.
          showToast('Fitur ini sedang disiapkan (Segera Hadir).', 'warning');
        } else {
          showToast('Fitur ini sedang dalam tahap pengembangan (Coming Soon).', 'warning');
        }"""
        
    app_js = app_js.replace(old_else, new_else)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(app_js)
    print("Updated Web App JS")

def update_desktop_app(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        app_js = f.read()

    app_js = app_js.replace('\r\n', '\n')
    
    # Update executeProcessing in Desktop App
    old_else = """        else {
          await new Promise(r => setTimeout(r, 1000));
          showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
        }"""
        
    new_else = """        else if (['word2pdf','pdf2word','ppt2pdf','pdf2ppt','excel2pdf','pdf2excel'].includes(activeTool)) {
          alert('Fitur ini membutuhkan Mesin Rendering Office.\\n\\nSilakan hapus (Uninstall) aplikasi ini dari Control Panel, lalu Instal ulang TANPA MENCENTANG kotak "Gunakan versi gratis".');
        } else {
          showToast('Fitur ini sedang disiapkan untuk versi Offline murni (Coming Soon).', 'warning');
        }"""
        
    app_js = app_js.replace(old_else, new_else)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(app_js)
    print("Updated Desktop App JS")

update_web_app('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js')
update_desktop_app('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js')
