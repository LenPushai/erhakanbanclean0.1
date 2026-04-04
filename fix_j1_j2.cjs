const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old1 = "        <td style=\"border:1px solid #000;padding:3px 6px\"><strong>SITE REQ:</strong><br>${val(job.site_req)}</td>\r\n      </tr></table>\r\n    </td>\r\n  </tr>\r\n</table>";

const new1 = "        <td style=\"border:1px solid #000;padding:3px 6px\"><strong>SITE REQ:</strong><br>${val(job.site_req)}</td>\r\n      </tr>\r\n      <tr>\r\n        <td colspan=\"2\" style=\"border:1px solid #000;padding:3px 6px\"><strong>ORDER / PO NUMBER:</strong><br><span style=\"font-size:10pt;font-weight:900\">${val(job.order_number || job.po_number)}</span></td>\r\n        <td colspan=\"2\" style=\"border:1px solid #000;padding:3px 6px\"><strong>DESCRIPTION:</strong><br>${val(job.description)}</td>\r\n      </tr></table>\r\n    </td>\r\n  </tr>\r\n</table>";

if (c.includes(old1)) {
  c = c.replace(old1, new1);
  console.log('FIX J1+J2 OK - Order number and description added');
} else {
  console.log('WARN - not found, check CRLF');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Done');
