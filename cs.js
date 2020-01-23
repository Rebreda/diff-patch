if (typeof(renderContent) === 'undefined') {
  renderContent = true;

  (function() {
    const opINS = 0;
    const opDEL = 1;
    const opCHANGE = 2;

    let hasLongLine = false;
    // line is HTML.
    function checkLongLine(line) {
      const text = htmlToText(line);
      const words = text.split(/\s+/);
      words.forEach(function(word) {
        if (word.length > 100) {
          hasLongLine = true;
        }
      });
    }

    const outputOneLine = function(out, line, cls) {
      checkLongLine(line);
      return out + '<tr class="' + cls + '"><td colspan="4">' + line + '</td></tr>';
    };
    const outputFileStart = function(out, line, idx) {
      checkLongLine(line);
      return out + '<tr class="filestart"><td colspan="4"><a id="file-' + idx + '"/>' + line + '</td></tr>';
    };

    const outputMinus = function(out, num, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum">' + num + '</td><td class="minusline">' + line + '</td><td class="linenum"></td><td></td></tr>';
    };
    const outputPlus = function(out, num, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum"></td><td></td><td class="linenum">' + num + '</td><td class="plusline">' + line + '</td></tr>';
    };

    const outputPair = function(out, lnum, lline, rnum, rline) {
      checkLongLine(lline);
      checkLongLine(rline);
      return out + '<tr><td class="linenum">' + lnum + '</td><td class="minusline">' + lline + '</td><td class="linenum">' + rnum + '</td><td class="plusline">' + rline + '</td></tr>';
    };

    const outputSame = function(out, lnum, rnum, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum">' + lnum + '</td><td>' + line + '</td><td class="linenum">' + rnum + '</td><td>' + line + '</td></tr>';
    };

    const matchingFromOps = function(la, lb, ops) {
      matA = new Array(la);
      matB = new Array(lb);
      for (let i = la, j = lb; i > 0 || j > 0; ) {
        var op;
        if (i == 0) {
          op = opINS;
        } else if (j == 0) {
          op = opDEL;
        } else {
          op = ops[(i-1)*lb+j-1];
        }

        switch (op) {
          case opINS:
            j--;
            matB[j] = -1;
            break;
          case opDEL:
            i--;
            matA[i] = -1;
            break;
          case opCHANGE:
            i--;
            j--;
            matA[i] = j;
            matB[j] = i;
            break;
        }
      }

      return {
        matA: matA,
        matB: matB,
      };
    };
    function ed(a, b) {
      const la = a.length; const lb = b.length;

      const f = new Array(lb+1);
      const ops = new Array(la*lb);

      f[0] = 0;
      for (var j = 1; j <= lb; j++) {
        f[j] = f[j-1] + 1;
      }

      // Matching with dynamic programming
      let p = 0;
      for (let i = 0; i < la; i++) {
        let fj1 = f[0]; // fj1 is the value of f[j - 1] in last iteration
        f[0] += 1;
        for (var j = 1; j <= lb; j++) {
          // delete
          let mn = f[j] + 1; let op = opDEL;

          let v = f[j-1] + 1;
          if (v < mn) {
            // insert
            mn = v;
            op = opINS;
          }

          // change/matched
          v = fj1 + (a[i] == b[j-1] ? 0 : 1);
          if (v < mn) {
            // insert
            mn = v;
            op = opCHANGE;
          }

          fj1 = f[j]; // save f[j] to fj1(j is about to increase)
          f[j] = mn; // update f[j] to mn
          ops[p] = op;

          p++;
        }
      }

      // Reversely find the match info
      const res = matchingFromOps(la, lb, ops);
      res.dist = f[lb];

      return res;
    }

    const fPlus = function(s) {
      return '<span class="plus">' + s + '</span>';
    };
    const fMinus = function(s) {
      return '<span class="minus">' + s + '</span>';
    };

    const cnvDiv = document.createElement('div');
    var htmlToText = function(html) {
      cnvDiv.innerHTML = html;
      return cnvDiv.innerText;
    };
    const textToHtml = function(text) {
      cnvDiv.innerText = text;
      return cnvDiv.innerHTML;
    };

    /**
     * a/b are text not HTML, fMark receive HTML, Return HTML
     */
    const mark = function(out, a, b, matA, fMark) {
      let same = ''; let mk = '';
      for (i = 0; i < a.length; i++) {
        if (matA[i] < 0 || a[i] != b[matA[i]]) {
          if (same) {
            out += textToHtml(same);
            same = '';
          }
          mk += a[i];
        } else {
          if (mk) {
            out += fMark(textToHtml(mk));
            mk = '';
          }
          same += a[i];
        }
      }
      if (same) {
        out += textToHtml(same);
      }
      if (mk) {
        out += fMark(textToHtml(mk));
      }
      return out;
    };

    const parseLine = function(line, ctx) {
      if (line == '---') {
        return {
          tp: 'line',
          line: line,
        };
      }

      let m;
      m = line.match('^@@ -([0-9]+),([0-9]+) [+]([0-9]+),([0-9]+) @@(.*)$');
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: parseInt(m[1]),
          lcnt: parseInt(m[2]),
          rstart: parseInt(m[3]),
          rcnt: parseInt(m[4]),
          info: m[5],
        };
      }
      m = line.match('^@@ -([0-9]+) [+]0,0 @@(.*)$');
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: 1,
          lcnt: parseInt(m[1]),
          rstart: 1,
          rcnt: 0,
          info: m[2],
        };
      }
      m = line.match('^@@ -0,0 [+]([0-9]+) @@(.*)$');
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: 1,
          lcnt: 0,
          rstart: 1,
          rcnt: parseInt(m[1]),
          info: m[2],
        };
      }

      m = line.match('^diff .*$');
      if (m) {
        return {
          tp: 'filestart',
          line: line,
        };
      }
      m = line.match('^[+][+][+] (.+)$');
      if (m) {
        return {
          tp: 'plusfile',
          fn: m[1],
        };
      }
      m = line.match('^--- (.+)$');
      if (m) {
        return {
          tp: 'minusfile',
          fn: m[1],
        };
      }

      m = line.match('^Subject: (.+)$');
      if (m) {
        return {
          tp: 'subject',
          subject: m[1],
        };
      }

      if (!ctx.ready) {
        return {
          tp: 'line',
          line: line,
        };
      }

      m = line.match('^ (.*)$');
      if (m) {
        return {
          tp: 'sameline',
          line: m[1],
        };
      }

      m = line.match('^[+](.*)$');
      if (m) {
        return {
          tp: 'plusline',
          line: m[1],
        };
      }

      m = line.match('^[-](.*)$');
      if (m) {
        return {
          tp: 'minusline',
          line: m[1],
        };
      }

      return {
        tp: 'line',
        line: line,
      };
    };

    if (typeof(renderContent) != 'undefined') {
    	g_parseLine = parseLine;
    }

    const clearCtx = function(out, ctx) {
      return out;
    };

    const files = [];
    let subject = '';
    const preList = document.getElementsByTagName('pre');
    for (var i = 0; i < preList.length; i++) {
      const pre = preList[i];
      let out = '';
      const lines = pre.innerHTML.split('\n');
      const buffered = '';
      let ctx = {};
      for (var j = 0; j < lines.length; j++) {
        const line = lines[j];

        const info = parseLine(line, ctx);
        console.log(info.tp + ': ' + line);

        if (info.tp == 'plusline') {
          if (ctx.buffered) {
            const bufferredLine = htmlToText(ctx.buffered.line);
            const curLine = htmlToText(info.line);
            const m = ed(bufferredLine, curLine);
            if (bufferredLine.trim() == curLine.trim() || m.dist < Math.max(bufferredLine.length, curLine.length)/2) {
              out = outputPair(out, ctx.lnum, mark('', bufferredLine, curLine, m.matA, fMinus), ctx.rnum,
                  mark('', curLine, bufferredLine, m.matB, fPlus));
              ctx.lnum++;
              ctx.rnum++;
            } else {
              out = outputMinus(out, ctx.lnum, ctx.buffered.line);
              ctx.lnum++;
              out = outputPlus(out, ctx.rnum, info.line);
              ctx.rnum++;
            }
            ctx.buffered = '';
          } else {
            out = outputPlus(out, ctx.rnum, info.line);
            ctx.rnum++;
          }

          continue;
        } else {
          if (ctx.buffered) {
            if (ctx.lnum >= ctx.lend) {
              out = outputOneLine(out, ctx.buffered.line, 'rawline');
            } else {
              out = outputMinus(out, ctx.lnum, ctx.buffered.line);
              ctx.lnum++;
            }
            ctx.buffered = '';
          }

          if (info.tp == 'subject') {
            subject = info.subject;
            continue;
          }
          if (info.tp == 'filestart') {
            ctx = {};
            const idx = files.length;
            files.push(line);
            out = outputFileStart(out, line, idx);
            continue;
          }
          if (info.tp == 'line') {
            out = outputOneLine(out, line, 'rawline');
            continue;
          }
          if (info.tp == 'sameline') {
            if (ctx.ready) {
              out = outputSame(out, ctx.lnum, ctx.rnum, info.line);
              ctx.lnum++;
              ctx.rnum++;
            } else {
              out = outputOneLine(out, line, 'rawline');
            }
            continue;
          }
          if (info.tp == 'minusfile') {
            ctx.lfn = info.fn;
            continue;
          }
          if (info.tp == 'plusfile') {
            ctx.rfn = info.fn;
            continue;
          }
          if (info.tp == 'lineinfo') {
            if (files.length > 0) {
              if (info.lcnt == 0) {
                files[files.length - 1] = '+ ' + ctx.rfn;
              } else if (info.rcnt == 0) {
                files[files.length - 1] = '- ' + ctx.lfn;
              } else {
                files[files.length - 1] = 'M ' + ctx.lfn;
              }
            }
            ctx.lnum = info.lstart;
            ctx.lend = info.lstart + info.lcnt;
            ctx.rnum = info.rstart;
            ctx.rend = info.rstart + info.rcnt;
            ctx.ready = true;
            out = outputOneLine(out, line, 'linenums');
            continue;
          }
          if (info.tp == 'minusline') {
            ctx.buffered = info;
            continue;
          }
        }
        out = outputOneLine(out, line, 'rawline');
        console.log(JSON.stringify(info));
      }
      if (subject) {
        out = outputOneLine('', subject, 'subject') + out;
      }
      out = '<table>' + out + '</table>';
      let fileLinks = '<div class="filelinks">';
      for (var j = 0; j < files.length; j++) {
        fileLinks += '<a href="#file-' + j + '">' + files[j] + '</a>';
      }
      fileLinks += '</div>';
      const formatCls = [
        'gvc_block',
        hasLongLine ? 'table_rel' : 'table_fix',
      ].join(' ');
      const formatDiv = '<div class="' + formatCls + '">' + fileLinks + out + '</div>';
      const rawDiv = '<div class="gvc_raw">' + pre.innerHTML + '</div>';
      pre.innerHTML = rawDiv + formatDiv;
    }
    document.body.classList.add('gvcrendered');
  })();
}
