
$(function() {
  var layer            = {}
    , count            = 0
    , $wrap            = $('#wrap')
    , $tool            = $('#tool')
    , $selectCells
    , defaultCellStyle =
      {'color'          : 'black'
      ,'font-family'    : '新細明體'
      ,'font-weight'    : 'normal'
      ,'font-style'     : 'normal'
      ,'font-size'      : '16px'
      ,'text-align'     : 'left'
      ,'vertical-align' : 'top'
      }
    , FontFmailyList   = ['arial','times new roman','新細明體']
    , fnGetBorderSelect
    ;

  $('body')
  //當滑鼠鍵點擊時，觸發點擊物件父元素裡的div.layer的focusin事件，並觸發focusin中的layer focusout事件
  .on('mousedown', function(e) {
    var $this       = $(e.target)
      , $focusLayer = $this.closest('div.layer')
      ;

    if ($this.closest('#tool').length < 1) {
      $wrap
        .find('div.layer.layerFocusIn')
          .each(function() {
            $.data(this, 'controller').focusout();
          })
      if ($focusLayer && $focusLayer.length) {
        $focusLayer.data('controller').focusin();
      }
    }
  });

  //聆聽新增Layer事件
  $('#add').on('click', function() {
    var newLayer = layer[count] = new Layer(count);
    count += 1;
    $wrap.append(newLayer.$);
  });
  //聆聽刪除Layer事件
  $('#delete').on('click', function() {
    var $wantDelete = $wrap.find('div.layer.layerFocusIn')
      , id          = $wantDelete.attr('data-id')
      ;
    delete layer[id];
    $wantDelete.remove()
  });

  //初始化字形選擇
  (function(_, list, $list) {
    var html = '<option value="">選擇字形</option>';
    _.each(list, function(v) {
      html += '<option value="' + v + '">' + v + '</option>';
    });
    $list.html(html);
  })(_, FontFmailyList, $tool.find('select.setTextFamily'));

  //獲得目前要設定的框線方向(陣列)
  fnGetBorderSelect = function() {
    var result = [];
    $tool.find('input.borderSelect:checked').each(function() {
      result.push($(this).attr('data-direction'));
    });
    return result;
  };

  //浮動工具列
  $tool
  //可移動化
  .draggable({
     'cursor' : 'move'
    ,'scroll' : true
  })
  //可調整大小化
  .resizable()
  //無框線
  .on('click', 'input.setBorderNone', function(e) {
    _.each(fnGetBorderSelect(), function(v) {
      $selectCells.css('border-' + v + '-width', '0');
    });
  })
  //框線樣式
  .on('change', 'select.setBorderStyle', function(e) {
    var style = $(this).val();
    if (! style) {
      return true;
    }
    _.each(fnGetBorderSelect(), function(v) {
      $selectCells
        .css('border-' + v + '-style', style)
        .css('border-' + v + '-width', '1px');
    });
  })
  //框線顏色
  .find('select.setBorderColor')
    .colourPicker({'title'   : '選擇框線顏色'
                  ,'openTxt' : '選擇框線顏色'
                  })
    .on('change'
       ,function() {
          var color = '#' + $(this).val();
          _.each(fnGetBorderSelect(), function(v) {
            $selectCells
              .css('border-' + v + '-color', color)
              .css('border-' + v + '-width', '1px');
          });
        })
    .end()
  //背景顏色
  .find('select.setBGColor')
    .colourPicker({'title'   : '選擇背景顏色'
                  ,'openTxt' : '選擇背景顏色'
                  })
    .on('change'
       ,function() {
         var color = '#' + $(this).val();
         //$selectCells.data('bgcolor', color);
         $selectCells.css('background-color', color);
       })
    .end()
  //刪除背景
  .on('click', 'input.deleteBG', function() {
    $selectCells
      .css('background-color', '')
      //.data('bgcolor', '');
  })
  //新增一列
  .on('click', 'input.addRow', function(e) {
    var $tr     = $selectCells.closest('tr').first()
      , table   = $tr.closest('table').data('controller')
      //新增於上方或下方
      , method  = $(this).attr('data-method')
      //新增列數
      , columns = $tr.find('td').length
      , $add    = $($.parseHTML('<tr></tr>'))
      , i
      ;

    for (i = 0; i < columns; i += 1) {
        $add.append(new Cell(table, '').$);
    }

    $tr[method]($add);
    //重設視覺位置
    table.setGridViewPos();
  })
  //新增一欄
  .on('click', 'input.addColumn', function(e) {
    var $column = $selectCells.first()
      , $table  = $column.closest('table')
      , table   = $table.data('controller')
      , index   = $column.parent().children('td').index($column)
      //新增於左方或右方
      , method  = $(this).attr('data-method')
      ;

    $table
      .find('tr')
        .each(function() {
          var $td = $(this).find('td').eq(index);
          if ($td.length) {
            $td[method](new Cell(table, '').$);
          }
        });
    //重設視覺位置
    table.setGridViewPos();
  })
  //新增一格
  .on('click', 'input.addCell', function(e) {
    var $td     = $selectCells.first()
      , table   = $td.closest('table').data('controller')
      //新增於左方或右方
      , method  = $(this).attr('data-method')
      ;

    $td[method](new Cell(table, '').$);
    //重設視覺位置
    table.setGridViewPos();
  })
  //合併儲存格
  .on('click', 'input.mergeGrids', function(e) {
    var $first        = $selectCells.first()
      , firstColIndex = $first.data('viewPosCol')
      , cols          = 0
      , rows          = 0
      , width         = 0
      , height        = 0
      , table         = $first.closest('table').data('controller')
      ;

    $first
      .closest('tr')
        .find($selectCells)
          .each(function(i) {
            var $this   = $(this)
              , colspan = parseInt($this.attr('colspan'), 10)
              ;
            cols += ((colspan > 1) ? colspan : 1);
            width += $this.width();
          });
    $selectCells
      .each(function() {
        var $this    = $(this)
          , colIndex = $this.data('viewPosCol')
          , rowspan
          ;
        if (colIndex === firstColIndex) {
          rowspan = parseInt($this.attr('rowspan'), 10);
          if (rowspan > 1) {
            rows += rowspan;
          }
          else {
            rows += 1;
          }
          height += $this.height();
        }
      });

    $selectCells.not($first).remove();
    $first
      .height(height)
      .width(width)
      .attr('rowspan', rows)
      .attr('colspan', cols);
    //重設視覺位置
    table.setGridViewPos();
    //視為重新選擇
    table.changeSelected();
  })
  //取消合併
  .on('click', 'input.splitGrids', function(e) {
    var $td     = $selectCells.first()
      , content = $td.html()
      , cols    = parseInt($td.attr('colspan'), 10)
      , rows    = parseInt($td.attr('rowspan'), 10)
      , width   = $td.width()
      , height  = $td.height()
      , $table  = $td.closest('table')
      , $trs    = $table.find('tr')
      , $tr     = $td.closest('tr')
      , tdIndex = $tr.find('td').index($td)
      , trIndex = $trs.index($tr)
      , table   = $table.data('controller')
      , i
      ;

    cols = isNaN(cols) ? 1 : cols;
    rows = isNaN(rows) ? 1 : rows;
    $td.remove();

    if (trIndex > 0) {
      $trs = $trs.filter(':gt(' + (trIndex - 1) + ')');
    }
    $trs = $trs.filter(':lt(' + rows + ')');
    $trs.each(function() {
      var $tr  = $(this)
        , $pos
        , i
        ;

      if (tdIndex <= 0) {
        for (i = 0; i < cols; i += 1) {
          $tr.prepend(new Cell(table, '').$.addClass('ui-selected'));
        }
      }
      else {
        $pos = $tr.find('td').eq( tdIndex - 1 );
        for (i = 0; i < cols; i += 1) {
          $pos.after(new Cell(table, '').$.addClass('ui-selected'));
        }
      }
    });

    width -= cols * 80;
    if (width < 80) {
      width = 80;
    }
    height -= rows * 20;
    if (height < 20) {
      height = 20
    }
    $table
      .find('td.ui-selected:first')
        .width(width)
        .height(height)
        .removeAttr('colspan')
        .removeAttr('rowspan')
        .html(content);
    //重設視覺位置
    table.setGridViewPos();
    //視為重新選擇
    table.changeSelected();
  })
  //設定字體
  .on('change', 'select.setTextFamily', function(e) {
    var family = $(this).val();
    if (! family) {
      return true;
    }
    $selectCells
    .each(function() {
      var style = $.data(this, 'controller').style;
      style['font-family'] = family;
      $(this)
        .css(style)
        .find('input')
          .css(style);
    });
  })
  //字形大小
  .on('change', 'select.setFontSize', function(e) {
    var size = $(this).val();
    $selectCells
    .each(function() {
      var style = $.data(this, 'controller').style;
      style['font-size'] = size;
      $(this)
        .css(style)
        .find('input')
          .css(style);
    });
  })
  //粗體
  .on('click', 'input.setBold', function(e) {
    $selectCells
    .each(function() {
      var style = $.data(this, 'controller').style;
      style['font-weight'] = 'bold';
      $(this)
        .css(style)
        .find('input')
          .css(style);
    });
    $(this).prop('disabled', true);
  })
  //斜體
  .on('click', 'input.setItalic', function(e) {
    $selectCells
    .each(function() {
      var style = $.data(this, 'controller').style;
      style['font-style'] = 'italic';
      $(this)
        .css(style)
        .find('input')
          .css(style);
    });
    $(this).prop('disabled', true);
  })
  //字形顏色
  .find('select.setTextColor')
    .colourPicker({'title'   : '選擇字形顏色'
                  ,'openTxt' : '選擇字形顏色'
                  })
    .on('change'
       ,function() {
          var color = '#' + $(this).val();
          $selectCells
          .each(function() {
            var style = $.data(this, 'controller').style;
            style['color'] = color;
            $(this)
              .css(style)
              .find('input')
                .css(style);
          });
        })
    .end()
  //對齊
  .on('click', 'input.setAlign', function(e) {
    var $this    = $(this)
      , text     = $this.attr('data-text')
      , vertical = $this.attr('data-vertical')
      , $buttons = $tool.find('input.setAlign')
      ;
    $selectCells.css({'text-align':text,'vertical-align':vertical});
    $buttons.prop('disabled', false);
    $this.prop('disabled', true);
  })
  //刪除樣式
  .on('click', 'input.deleteStyle', function(e) {
    $selectCells
      .each(function() {
        var style      = $.extend({}, defaultCellStyle)
          , controller = $.data(this, 'controller')
          ;
        controller.style = style;
        $(this)
          .css({'border-width'        : '0'
               ,'background-color'    : ''
               ,'text-align'          : 'left'
               ,'vertical-align'      : 'middle'
               ,'border-left-style'   : ''
               ,'border-top-style'    : ''
               ,'border-right-style'  : ''
               ,'border-bottom-style' : ''
               ,'border-left-color'   : ''
               ,'border-top-color'    : ''
               ,'border-right-color'  : ''
               ,'border-bottom-color' : ''
              })
          .css(style)
          .find('input')
            .css(style);
      });
  })
  //刪除內容
  .on('click', 'input.deleteContent', function(e) {
    $selectCells
      .removeAttr('style')
      .each(function() {
        var $this = $(this)
          , $temp = $this.children().not('input').detach()
          ;
        $this
          .empty()
          .append($temp);
      })
  })
  //刪除儲存格
  .on('click', 'input.deleteGrid', function(e) {
    var table = $selectCells.closest('table').data('controller');
    $selectCells.remove();
    //重設視覺位置
    table.setGridViewPos();
  })
  //選取特定格子
  .on('click', 'input.selectSome', function(e) {
    var $layer         = $wrap.find('div.layer.layerFocusIn')
      , table          = $layer.data('controller').table
      , $tds           = $layer.find('td')
      , tableView      = []
      , $click         = $(this)
      , selectRow      = ($click.attr('data-selectrow') === '1')
      , needNumber     = parseInt($click.attr('data-selecteven'), 10)
      , noFirstRow     = $tool.find('input.noFirstRow').prop('checked')
      , notFirstColumn = $tool.find('input.noFirstColumn').prop('checked')
      ;

    $layer
      .find('td.ui-selected')
        .removeClass('ui-selected');

    $tds.each(function() {
      var $this    = $(this)
        , colIndex = $this.data('viewPosCol')
        , rowIndex = $this.data('viewPosRow')
        , checkIndex
        ;
      if (noFirstRow && rowIndex === 0) {
        return true;
      }
      if (notFirstColumn && colIndex === 0) {
        return true;
      }
      checkIndex = selectRow ? rowIndex : colIndex;
      if (checkIndex % 2 === needNumber) {
        $this.addClass('ui-selected')
      }
    });
    table.changeSelected();
  })
  //Padding
  .on('click', 'input.setPadding', function(e) {
    var padding = $tool.find('input.Padding').val();
    $selectCells.css('padding', padding + 'px');
  })
  //重設表格
  .on('click', 'input.resetTable', function(e) {
    var row    = parseInt($tool.find('input.newRow').val(), 10)
      , col    = parseInt($tool.find('input.newCol').val(), 10)
      , table  = $wrap.find('div.layer.layerFocusIn:first').data('controller').table
      ;
    table.reset(row, col);
    table.setGridViewPos();
  });
  //Layer工廠函式
  function Layer(id) {
    var $area       = $($.parseHTML('<div class="layer" id="layer' + id + '" data-id="' + id + '"></div>'))
      , table       = new Table(this)
      , _this       = this
      ;

    $area
    //可移動化
    .draggable({
       'cursor' : 'move'
      ,'scroll' : true
    })
    //可調整大小化
    .resizable()
    //置入table
    .append(table.$);

    //導出元件
    this.id    = id;
    this.$     = $area;
    this.table = table;
    this.$table= table.$;
    $area.data('controller', this);
    return this;
  }
  //focusin時的處理
  Layer.prototype.focusin = function() {
    //改變class
    this.$
    .removeClass('layerFocusIng')
    .addClass('layerFocusIn');
    //顯示浮動工具列
    $tool.show();
  };
  //focusout時的處理
  Layer.prototype.focusout = function() {
    //移除class
    this.$.removeClass('layerFocusIn');
    //將focusout事件傳遞給內置table
    this.table.focusout();
    //隱藏浮動工具列
    $tool.hide();
  };

  //Table工廠函式
  function Table(parent) {
    var $area             = $($.parseHTML('<table><tbody></tbody></table>'))
      , $tbody            = $area.find('tbody')
      , i
      , j
      , $row
      , fnChangeSelected  = _.debounce(_.throttle(_.bind(this.changeSelected, this), 10), 10)
      ;

    $area
    .selectable({
       'filter'     : 'tbody td'
      ,'selected'   : fnChangeSelected
      ,'unselected' : fnChangeSelected
    });

    //導出元件
    this.$      = $area;
    this.$tbody = $tbody;
    this.parent = parent;
    $area.data('controller', this);

    //初始化，建立3*3表格
    this.reset(3);

    return this;
  }
  //重設表格
  Table.prototype.reset = function() {
    var rows    = arguments[0]
      , cols    = rows
      , input   = rows
      , $result = new $
      , $tr
      , i
      , j
      , length1
      , length2
      , tempArray
      ;
    if (typeof rows === 'number') {
      if (typeof arguments[1] === 'number') {
        cols = arguments[1];
      }
      for (i = 0; i < rows; i += 1) {
        $tr = $($.parseHTML('<tr></tr>'));
        for (j = 0; j < cols; j += 1) {
            $tr.append(new Cell(this, 'text').$);
        }
        $result = $result.add($tr);
      }
      this.$tbody.empty().html($result);
    }
    else if ($.isArray(input)) {
      length1 = input.length;
      for (i = 0; i < input.length; i += 1) {
        tempArray = input[i];
        if (! $.isArray(tempArray)) {
          continue;
        }
        length2 = tempArray.length;
        $tr = $($.parseHTML('<tr></tr>'));
        for (j = 0; j < length2; j += 1) {
            $tr.append(new Cell(this, tempArray[j]).$);
        }
        $result = $result.add($tr);
      }
      this.$tbody.empty().html($result);
    }
    //重設視覺位置
    this.setGridViewPos();
  };
  //所在的Layer focusout時的處理
  Table.prototype.focusout = function() {
    this.$
      .find('input')
        .each(function() {
          $(this).closest('td').trigger('changeToText');
        });
  }
  //改變選擇格子時
  Table.prototype.changeSelected = function() {
    var _this = this;
    $selectCells = this.$.find('td.ui-selected');
    //取消可編輯模式
    this.$
      .find('div.text')
        .prop('contenteditable', false);

    //重設功能選項
    $tool
      .find(':disabled')
        .prop('disabled', false)
        .end()
      .find(':checkbox')
        .prop('checked', false)
        .filter('.borderSelect')
          .prop('checked', true)

    //若所選格子數量為1
    if ($selectCells.length === 1) {
      var style  = $selectCells.data('controller').style;
      //調整浮動tool的選項預設值
      $tool
        //框線樣式
        .find('select.setBorderStyle')
          .val($selectCells.css('border-style'))
          .end()
        //字體
        .find('select.setTextFamily')
          .val(style['font-family'])
          .end()
        //字形大小
        .find('select.setFontSize')
          .val(style['font-size'])
          .end()
        //對齊
        .find('input.setAlign[data-text="' + $selectCells.css('text-align') + '"][data-vertical="' + $selectCells.css('vertical-align') + '"]')
          .prop('disabled', true)
          .end()
        //padding
        .find('input.Padding')
          .val(parseInt($selectCells.css('padding'), 10))
      //粗體
      if (style['font-weight'] === 'bold') {
        $tool.find('input.setBold').prop('disabled', true)
      }
      //斜體
      if (style['font-style'] === 'italic') {
        $tool.find('input.setItalic').prop('disabled', true)
      }
      //不可合併儲存格
      $tool.find('input.mergeGrids').prop('disabled', true);
      //若非合併格不可取消合併
      if (! ($selectCells.attr('rowspan') || $selectCells.attr('colspan')) ) {
        $tool.find('input.splitGrids').prop('disabled', true);
      }
      //有合並列時不能新增一列
      if (parseInt($selectCells.attr('rowspan'), 10) > 1) {
        $tool.find('input.addRow').prop('disabled', true);
        //不可新增單一格子
        $tool.find('input.addCell').prop('disabled', true)
      }
      //有合並欄時不能新增一列
      if (parseInt($selectCells.attr('colspan'), 10) > 1) {
        $tool.find('input.addColumn').prop('disabled', true);
        //不可新增單一格子
        $tool.find('input.addCell').prop('disabled', true)
      }

      //開啟可編輯模式
      $selectCells.find('div.text').prop('contenteditable', true).trigger('focus');
    }
    //選取複數格時
    else {
      $tool
        //不可新增單一格子
        .find('input.addCell')
          .prop('disabled', true)
        .end()
        //不可取消合併
        .find('input.splitGrids')
          .prop('disabled', true);

      var isSameRow
        , isSameColmn
        , isRect
        ;
      //是否同一列
      isSameRow = (function($td) {
        var result = true;
        if ($td.closest('tr').length !== 1) {
          return false;
        }
        $td.each(function() {
          if (parseInt($(this).attr('rowspan'), 10) > 1) {
            result = false;
            return false;
          }
        });
        return result;
      })($selectCells);
      //是否同一欄
      isSameColmn = (function($td) {
        var colIndex = $td.eq(0).data('viewPosCol')
          , result   = true;
          ;
        $td.each(function() {
          if ($.data(this, 'viewPosCol') !== colIndex || parseInt($(this).attr('colspan'), 10) > 1 ) {
            result = false;
            return false;
          }
        });
        return result;
      })($selectCells);
      //是否矩形
      isRect = (function($td) {
        var $first      = $td.eq(0)
          , minColIndex = $first.data('viewPosCol')
          , maxColIndex = $first.data('viewPosCol')
          , minRowIndex = $first.data('viewPosRow')
          , maxRowIndex = $first.data('viewPosRow')
          , haveCell    = {}
          , i
          , j
          ;
        $td.each(function() {
          var $this   = $(this)
            , minCol  = $this.data('viewPosCol')
            , minRow  = $this.data('viewPosRow')
            , cols    = parseInt($this.attr('colspan'), 10)
            , rows    = parseInt($this.attr('rowspan'), 10)
            , maxCol  = minCol
            , maxRow  = minRow
            , i
            , j
            ;
          minColIndex = ((minColIndex < minCol) ? minColIndex : minCol);
          minRowIndex = ((minRowIndex < minRow) ? minRowIndex : minRow);
          if (cols > 1) {
            maxCol += cols - 1;
          }
          if (rows > 1) {
            maxRow += rows - 1;
          }
          maxColIndex = ((maxColIndex > maxCol) ? maxColIndex : maxCol);
          maxRowIndex = ((maxRowIndex > maxRow) ? maxRowIndex : maxRow);
          for (i = minCol; i <= maxCol; i += 1) {
            for (j = minRow; j <= maxRow; j += 1) {
              haveCell[i + ',' + j] = true;
            }
          }
        });
        for (i = minColIndex; i <= maxColIndex; i += 1) {
          for (j = minRowIndex; j <= maxRowIndex; j += 1) {
            if (haveCell[i + ',' + j] !== true) {
              return false;
            }
          }
        }
        return true;
      })($selectCells);

      //不同列時不能新增一列
      if (! isSameRow) {
        $tool
          .find('input.addRow')
            .prop('disabled', true);
      }
      //不同欄時不能新增一欄
      if (! isSameColmn) {
        $tool
          .find('input.addColumn')
            .prop('disabled', true);
      }
      //非矩形時不能合併
      if (! isRect) {
        $tool
          .find('input.mergeGrids')
            .prop('disabled', true);
      }
    }
  };
  //每個Cell上設定其在瀏覽者看起來的視覺位置
  Table.prototype.setGridViewPos = function() {
    var $table     = this.$
      , mergeCells = []
      , result     = {}
      ;

    //先預設其位置，並記憶有哪些格子是合併過的格子 與其資訊
    $table.find('tr').each(function(rowIndex) {
      $(this).find('td').each(function(colIndex) {
        var $td    = $(this)
          , cols   = parseInt($td.attr('colspan'), 10)
          , rows   = parseInt($td.attr('rowspan'), 10)
          ;

        $.data(this, 'viewPosRow', rowIndex);
        $.data(this, 'viewPosCol', colIndex);
        if (cols > 1 || rows > 1) {
          mergeCells.push(
            {'cols'   : (cols > 1) ? cols : 1
            ,'rows'   : (rows > 1) ? rows : 1
            ,'$'      : $td
            }
          );
        }
      });
    });
    //將合併的格子以 posCol位置排序
    mergeCells = _.sortBy(mergeCells, function(cell){ return cell.posCol; });
    //重設合併格之後的所有格子視覺位置
    _.each(mergeCells, function(cell) {
      var $td    = cell.$
        , posCol = $td.data('viewPosCol')
        , posRow = $td.data('viewPosRow')
        , cols   = cell.cols
        , rows   = cell.rows
        , adjCol = cols - 1
        , adjRow = rows - 1
        ;
      //重設位於其後的所有格子視覺位置
      $table.find('td').each(function() {
        var $this      = $(this)
          , thisPosRow = $this.data('viewPosRow')
          , thisPosCol = $this.data('viewPosCol')
          ;

        //與合併格同列且位於其右的格子
        if (thisPosRow === posRow && thisPosCol > posCol) {
          $this.data('viewPosCol', (thisPosCol + adjCol));
          //console.log(this, thisPosCol, $this.data('viewPosCol'));
        }
        //位於合併格所在之列之下位置受影響的格子
        else if (thisPosRow > posRow && thisPosCol >= posCol && thisPosRow < (posRow + rows)) {
          $this.data('viewPosCol', (thisPosCol + adjCol + 1));
          //console.log(this, thisPosCol, $this.data('viewPosCol'));
        }
      });
    });
  };

  //Cell工廠函式
  function Cell(parent, text) {
    var $area = $($.parseHTML('<td><div class="content"><div class="text">' + text + '</div></div></td>'))
      , $text = $area
      //初始樣式設定
      , style = $.extend({}, defaultCellStyle)
      ;

    //可調整大小化
    $area
    .resizable({'handles':'e, s'})
    .css(style)
    .width(80)
    .height(20)
    .find('div.ui-resizable-handle')
      .detach()
      .appendTo($area.find('div.content'));

    //導出元件
    this.$      = $area;
    this.$text  = $text;
    this.parent = parent;
    this.style  = style;
    $area.data('controller', this);
    return this;
  }

});
