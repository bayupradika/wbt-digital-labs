import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Fix the first missing backtick
app_js = re.sub(
    r'modal\.innerHTML = \s*<div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">',
    r'modal.innerHTML = `\n      <div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">',
    app_js
)

# Fix the closing backtick
app_js = re.sub(
    r'</button>\s*</div>\s*;\s*document\.body\.appendChild\(modal\);',
    r'</button>\n      </div>\n    `;\n    document.body.appendChild(modal);',
    app_js
)

# Wait, the closing backtick in task 807 was:
# </button>
# </div>
# ;
# document.body.appendChild(modal);

# Let's just fix it manually if regex fails
if ';    document.body.appendChild(modal);' in app_js:
    app_js = app_js.replace(';    document.body.appendChild(modal);', '`;\n    document.body.appendChild(modal);')
elif '</div>\n    ;\n    document.body.appendChild(modal);' in app_js:
    app_js = app_js.replace('</div>\n    ;\n    document.body.appendChild(modal);', '</div>\n    `;\n    document.body.appendChild(modal);')
else:
    # Just replace all `</div>\s*;\s*document.body.appendChild(modal);` with `</div>\n    `;\n    document.body.appendChild(modal);`
    app_js = re.sub(r'</div>\s*;\s*document\.body\.appendChild\(modal\);', r'</div>\n    `;\n    document.body.appendChild(modal);', app_js)


with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
