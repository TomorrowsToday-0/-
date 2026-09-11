/* =========================================================
   Tomorrow Cut Optimizer
========================================================= */


/* =========================================================
   마지막 계산 결과 저장

   모바일에서도 PDF를 누르면
   PDF용 큰 사이즈로 다시 그리기 위해 사용
========================================================= */

let lastBestResult = null;
let lastSheetSettings = null;


/* =========================================================
   규격별 색상
========================================================= */

const PART_COLORS = [

  "#D6EAF8",
  "#D5F5E3",
  "#FCF3CF",
  "#FADBD8",
  "#E8DAEF",
  "#D4E6F1",
  "#FDEBD0",
  "#D5DBDB",
  "#E9F7EF",
  "#F5EEF8",
  "#F9E79F",
  "#AED6F1",
  "#A9DFBF",
  "#F5CBA7",
  "#D2B4DE",
  "#F1948A"

];


const partColorMap =
  new Map();


function resetPartColors() {

  partColorMap.clear();

}


function getPartSizeKey(part) {

  /*
     400 × 900
     900 × 400

     같은 규격으로 판단
  */

  const small =
    Math.min(
      part.originalWidth,
      part.originalHeight
    );


  const large =
    Math.max(
      part.originalWidth,
      part.originalHeight
    );


  return (
    `${roundKey(small)}x${roundKey(large)}`
  );

}


function getPartColor(part) {

  const key =
    getPartSizeKey(
      part
    );


  if (
    !partColorMap.has(key)
  ) {

    const index =
      partColorMap.size
      %
      PART_COLORS.length;


    partColorMap.set(
      key,
      PART_COLORS[index]
    );

  }


  return partColorMap.get(
    key
  );

}



/* =========================================================
   기본
========================================================= */

function getCutMode() {

  return (
    document.querySelector(
      'input[name="cutMode"]:checked'
    )?.value
    ||
    "free"
  );

}


function getTrimDirection() {

  return (
    document.querySelector(
      'input[name="trimDirection"]:checked'
    )?.value
    ||
    "width"
  );

}



/* =========================================================
   결방향
========================================================= */

function updateCutMode() {

  const mode =
    getCutMode();


  const rotateChecks =
    document.querySelectorAll(
      ".part-rotate"
    );


  const notice =
    document.getElementById(
      "modeNotice"
    );


  if (
    mode === "grain"
  ) {

    rotateChecks.forEach(
      check => {

        check.checked =
          false;

        check.disabled =
          true;

      }
    );


    notice.innerHTML =

      "결방향 고려 · 부재 회전 금지 · 원장 길이 방향을 유지한 스트립부터 재단";

  }

  else {

    rotateChecks.forEach(
      check => {

        check.disabled =
          false;

      }
    );


    notice.innerHTML =

      "결방향 고려 안 함 · 회전 허용 부재는 90° 배치까지 비교";

  }

}



/* =========================================================
   가재단
========================================================= */

function updateTrimUI() {

  const enabled =
    document.getElementById(
      "trimEnabled"
    ).checked;


  document
    .getElementById(
      "trimSettings"
    )
    .classList
    .toggle(
      "disabled",
      !enabled
    );


  updateTrimInfo();

}


function updateTrimInfo() {

  const enabled =
    document.getElementById(
      "trimEnabled"
    ).checked;


  const info =
    document.getElementById(
      "trimInfo"
    );


  if (
    !enabled
  ) {

    info.innerHTML =
      "<strong>가재단 미사용</strong>";

    return;

  }


  const trim =
    Number(
      document.getElementById(
        "trimAmount"
      ).value
    )
    ||
    0;


  const kerf =
    Number(
      document.getElementById(
        "kerf"
      ).value
    )
    ||
    0;


  const offset =
    trim
    +
    kerf;


  info.innerHTML = `

    가재단

    ${formatNumber(trim)}mm

    +

    톱날 두께

    ${formatNumber(kerf)}mm

    =

    <strong>

      실제 시작 오프셋

      ${formatNumber(offset)}mm

    </strong>

  `;

}



/* =========================================================
   부재 추가
========================================================= */

function addPart() {

  const list =
    document.getElementById(
      "partList"
    );


  const count =
    list.querySelectorAll(
      ".part-row"
    ).length;


  const name =
    String.fromCharCode(
      65
      +
      (
        count % 26
      )
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "part-row";


  row.innerHTML = `

    <input
      class="part-name"
      type="text"
      value="${name}"
    >


    <div class="unit-input">

      <input
        class="part-width"
        type="number"
        value="300"
        min="1"
      >

      <span>
        mm
      </span>

    </div>


    <div class="unit-input">

      <input
        class="part-height"
        type="number"
        value="300"
        min="1"
      >

      <span>
        mm
      </span>

    </div>


    <input
      class="part-qty"
      type="number"
      value="1"
      min="1"
    >


    <label class="rotation-check">

      <input
        class="part-rotate"
        type="checkbox"
        checked
      >

      90° 가능

    </label>


    <button
      type="button"
      class="delete-button"
      onclick="deletePart(this)"
    >
      ×
    </button>

  `;


  list.appendChild(
    row
  );


  updateCutMode();

}



/* =========================================================
   부재 삭제
========================================================= */

function deletePart(button) {

  const rows =
    document.querySelectorAll(
      ".part-row"
    );


  if (
    rows.length <= 1
  ) {

    alert(
      "부재는 최소 1개 이상 필요합니다."
    );

    return;

  }


  button
    .closest(
      ".part-row"
    )
    .remove();

}



/* =========================================================
   원장 설정
========================================================= */

function getSheetSettings() {

  const sheetWidth =
    Number(
      document.getElementById(
        "sheetWidth"
      ).value
    );


  const sheetHeight =
    Number(
      document.getElementById(
        "sheetHeight"
      ).value
    );


  const kerf =
    Number(
      document.getElementById(
        "kerf"
      ).value
    );


  const trimEnabled =
    document.getElementById(
      "trimEnabled"
    ).checked;


  const trimAmount =
    trimEnabled
    ?
    Number(
      document.getElementById(
        "trimAmount"
      ).value
    )
    :
    0;


  const trimDirection =
    getTrimDirection();


  const trimOffset =
    trimEnabled
    ?
    trimAmount
    +
    kerf
    :
    0;


  let startX =
    0;


  let startY =
    0;


  let usableWidth =
    sheetWidth;


  let usableHeight =
    sheetHeight;


  if (
    trimEnabled
  ) {

    if (
      trimDirection
      ===
      "width"
    ) {

      startX =
        trimOffset;


      usableWidth -=
        trimOffset;

    }

    else {

      startY =
        trimOffset;


      usableHeight -=
        trimOffset;

    }

  }


  return {

    sheetWidth,

    sheetHeight,

    kerf,

    trimEnabled,

    trimAmount,

    trimDirection,

    trimOffset,

    startX,

    startY,

    usableWidth,

    usableHeight

  };

}



/* =========================================================
   부재 읽기
========================================================= */

function readParts() {

  const mode =
    getCutMode();


  const parts =
    [];


  document
    .querySelectorAll(
      ".part-row"
    )
    .forEach(
      (
        row,
        rowIndex
      ) => {


        const name =
          row
            .querySelector(
              ".part-name"
            )
            .value
            .trim()

          ||

          `P${rowIndex + 1}`;


        const width =
          Number(
            row
              .querySelector(
                ".part-width"
              )
              .value
          );


        const height =
          Number(
            row
              .querySelector(
                ".part-height"
              )
              .value
          );


        const qty =
          Math.floor(
            Number(
              row
                .querySelector(
                  ".part-qty"
                )
                .value
            )
          );


        const rotateInput =
          row.querySelector(
            ".part-rotate"
          );


        const canRotate =
          mode === "free"
          &&
          rotateInput.checked;


        if (
          width <= 0
          ||
          height <= 0
          ||
          qty <= 0
        ) {

          return;

        }


        for (
          let i = 0;
          i < qty;
          i++
        ) {

          parts.push({

            id:
              `${rowIndex}_${i}`,

            name,

            originalWidth:
              width,

            originalHeight:
              height,

            canRotate,

            sourceIndex:
              rowIndex

          });

        }

      }
    );


  return parts;

}



/* =========================================================
   방향 선택
========================================================= */

function chooseOrientation(
  part,
  direction,
  strategy,
  settings
) {

  const options = [

    {

      width:
        part.originalWidth,

      height:
        part.originalHeight,

      rotated:
        false

    }

  ];


  if (
    part.canRotate
    &&
    part.originalWidth
    !==
    part.originalHeight
  ) {

    options.push({

      width:
        part.originalHeight,

      height:
        part.originalWidth,

      rotated:
        true

    });

  }


  const valid =
    options.filter(
      option =>

        option.width
        <=
        settings.usableWidth

        &&

        option.height
        <=
        settings.usableHeight
    );


  if (
    !valid.length
  ) {

    return null;

  }


  if (
    valid.length === 1
  ) {

    return valid[0];

  }


  if (
    strategy === "original"
  ) {

    return (
      valid.find(
        item =>
          !item.rotated
      )
      ||
      valid[0]
    );

  }


  if (
    strategy === "rotated"
  ) {

    return (
      valid.find(
        item =>
          item.rotated
      )
      ||
      valid[0]
    );

  }


  if (
    strategy === "thin"
  ) {

    if (
      direction
      ===
      "horizontal"
    ) {

      return valid
        .slice()
        .sort(
          (
            a,
            b
          ) =>
            a.height
            -
            b.height
        )[0];

    }


    return valid
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          a.width
          -
          b.width
      )[0];

  }


  if (
    strategy === "long"
  ) {

    if (
      direction
      ===
      "horizontal"
    ) {

      return valid
        .slice()
        .sort(
          (
            a,
            b
          ) =>
            b.width
            -
            a.width
        )[0];

    }


    return valid
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          b.height
          -
          a.height
      )[0];

  }


  return valid[0];

}



/* =========================================================
   방향 적용
========================================================= */

function orientParts(
  parts,
  direction,
  strategy,
  settings
) {

  const result =
    [];


  for (
    const part
    of parts
  ) {

    const orientation =
      chooseOrientation(
        part,
        direction,
        strategy,
        settings
      );


    if (
      !orientation
    ) {

      return null;

    }


    result.push({

      ...part,

      width:
        orientation.width,

      height:
        orientation.height,

      rotated:
        orientation.rotated

    });

  }


  return result;

}



/* =========================================================
   스트립 생성
========================================================= */

function createStrips(
  parts,
  direction,
  settings,
  ascending
) {

  const groups =
    new Map();


  parts.forEach(
    part => {


      const thickness =
        direction
        ===
        "horizontal"

        ?

        part.height

        :

        part.width;


      const key =
        String(
          thickness
        );


      if (
        !groups.has(key)
      ) {

        groups.set(
          key,
          []
        );

      }


      groups
        .get(key)
        .push(part);

    }
  );


  const strips =
    [];


  groups.forEach(
    (
      groupParts,
      key
    ) => {


      const capacity =
        direction
        ===
        "horizontal"

        ?

        settings.usableWidth

        :

        settings.usableHeight;


      groupParts.sort(
        (
          a,
          b
        ) => {


          const lengthA =
            direction
            ===
            "horizontal"

            ?

            a.width

            :

            a.height;


          const lengthB =
            direction
            ===
            "horizontal"

            ?

            b.width

            :

            b.height;


          return (
            ascending
            ?
            lengthA
            -
            lengthB
            :
            lengthB
            -
            lengthA
          );

        }
      );


      groupParts.forEach(
        part => {


          const length =
            direction
            ===
            "horizontal"

            ?

            part.width

            :

            part.height;


          let selected =
            null;


          let smallestRemain =
            Infinity;


          strips.forEach(
            strip => {


              if (
                strip.thickness
                !==
                Number(key)
              ) {

                return;

              }


              const extra =
                (
                  strip.parts.length
                  ?
                  settings.kerf
                  :
                  0
                )
                +
                length;


              const nextUsed =
                strip.usedLength
                +
                extra;


              if (
                nextUsed
                <=
                capacity
              ) {


                const remain =
                  capacity
                  -
                  nextUsed;


                if (
                  remain
                  <
                  smallestRemain
                ) {

                  smallestRemain =
                    remain;


                  selected =
                    strip;

                }

              }

            }
          );


          if (
            !selected
          ) {

            selected = {

              thickness:
                Number(key),

              direction,

              parts:
                [],

              usedLength:
                0

            };


            strips.push(
              selected
            );

          }


          if (
            selected.parts.length
          ) {

            selected.usedLength +=
              settings.kerf;

          }


          selected.parts.push(
            part
          );


          selected.usedLength +=
            length;

        }
      );

    }
  );


  return strips;

}



/* =========================================================
   원장에 스트립 배치
========================================================= */

function packSheets(
  strips,
  direction,
  settings
) {

  const capacity =
    direction
    ===
    "horizontal"

    ?

    settings.usableHeight

    :

    settings.usableWidth;


  strips.sort(
    (
      a,
      b
    ) =>
      b.thickness
      -
      a.thickness
  );


  const sheets =
    [];


  strips.forEach(
    strip => {


      let selected =
        null;


      let smallestRemain =
        Infinity;


      sheets.forEach(
        sheet => {


          const extra =
            (
              sheet.strips.length
              ?
              settings.kerf
              :
              0
            )
            +
            strip.thickness;


          const nextUsed =
            sheet.used
            +
            extra;


          if (
            nextUsed
            <=
            capacity
          ) {


            const remain =
              capacity
              -
              nextUsed;


            if (
              remain
              <
              smallestRemain
            ) {

              smallestRemain =
                remain;


              selected =
                sheet;

            }

          }

        }
      );


      if (
        !selected
      ) {

        selected = {

          strips:
            [],

          used:
            0,

          parts:
            [],

          cuts:
            [],

          offcuts:
            []

        };


        sheets.push(
          selected
        );

      }


      if (
        selected.strips.length
      ) {

        selected.used +=
          settings.kerf;

      }


      selected.strips.push(
        strip
      );


      selected.used +=
        strip.thickness;

    }
  );


  return sheets;

}



/* =========================================================
   가로 스트립 좌표
========================================================= */

function layoutHorizontal(
  sheet,
  settings
) {

  let y =
    settings.startY;


  sheet.parts =
    [];


  sheet.cuts =
    [];


  sheet.offcuts =
    [];


  sheet.strips.forEach(
    (
      strip,
      stripIndex
    ) => {


      strip.index =
        stripIndex + 1;


      strip.x =
        settings.startX;


      strip.y =
        y;


      strip.width =
        settings.usableWidth;


      strip.height =
        strip.thickness;


      let x =
        settings.startX;


      strip.parts.forEach(
        (
          part,
          partIndex
        ) => {


          part.x =
            x;


          part.y =
            y;


          sheet.parts.push(
            part
          );


          x +=
            part.width;


          if (
            partIndex
            <
            strip.parts.length
            -
            1
          ) {

            sheet.cuts.push({

              direction:
                "vertical",

              x,

              y,

              length:
                strip.height,

              kerf:
                settings.kerf

            });


            x +=
              settings.kerf;

          }

        }
      );


      const remain =
        settings.startX
        +
        settings.usableWidth
        -
        x;


      if (
        remain
        >
        settings.kerf
      ) {

        sheet.cuts.push({

          direction:
            "vertical",

          x,

          y,

          length:
            strip.height,

          kerf:
            settings.kerf

        });


        sheet.offcuts.push({

          x:
            x
            +
            settings.kerf,

          y,

          width:
            remain
            -
            settings.kerf,

          height:
            strip.height

        });

      }


      y +=
        strip.height;


      if (
        stripIndex
        <
        sheet.strips.length
        -
        1
      ) {

        sheet.cuts.push({

          direction:
            "horizontal",

          x:
            settings.startX,

          y,

          length:
            settings.usableWidth,

          kerf:
            settings.kerf

        });


        y +=
          settings.kerf;

      }

    }
  );


  const remainBottom =
    settings.startY
    +
    settings.usableHeight
    -
    y;


  if (
    remainBottom
    >
    settings.kerf
  ) {

    sheet.cuts.push({

      direction:
        "horizontal",

      x:
        settings.startX,

      y,

      length:
        settings.usableWidth,

      kerf:
        settings.kerf

    });


    sheet.offcuts.push({

      x:
        settings.startX,

      y:
        y
        +
        settings.kerf,

      width:
        settings.usableWidth,

      height:
        remainBottom
        -
        settings.kerf

    });

  }

}



/* =========================================================
   세로 스트립 좌표
========================================================= */

function layoutVertical(
  sheet,
  settings
) {

  let x =
    settings.startX;


  sheet.parts =
    [];


  sheet.cuts =
    [];


  sheet.offcuts =
    [];


  sheet.strips.forEach(
    (
      strip,
      stripIndex
    ) => {


      strip.index =
        stripIndex + 1;


      strip.x =
        x;


      strip.y =
        settings.startY;


      strip.width =
        strip.thickness;


      strip.height =
        settings.usableHeight;


      let y =
        settings.startY;


      strip.parts.forEach(
        (
          part,
          partIndex
        ) => {


          part.x =
            x;


          part.y =
            y;


          sheet.parts.push(
            part
          );


          y +=
            part.height;


          if (
            partIndex
            <
            strip.parts.length
            -
            1
          ) {

            sheet.cuts.push({

              direction:
                "horizontal",

              x,

              y,

              length:
                strip.width,

              kerf:
                settings.kerf

            });


            y +=
              settings.kerf;

          }

        }
      );


      const remain =
        settings.startY
        +
        settings.usableHeight
        -
        y;


      if (
        remain
        >
        settings.kerf
      ) {

        sheet.cuts.push({

          direction:
            "horizontal",

          x,

          y,

          length:
            strip.width,

          kerf:
            settings.kerf

        });


        sheet.offcuts.push({

          x,

          y:
            y
            +
            settings.kerf,

          width:
            strip.width,

          height:
            remain
            -
            settings.kerf

        });

      }


      x +=
        strip.width;


      if (
        stripIndex
        <
        sheet.strips.length
        -
        1
      ) {

        sheet.cuts.push({

          direction:
            "vertical",

          x,

          y:
            settings.startY,

          length:
            settings.usableHeight,

          kerf:
            settings.kerf

        });


        x +=
          settings.kerf;

      }

    }
  );


  const remainRight =
    settings.startX
    +
    settings.usableWidth
    -
    x;


  if (
    remainRight
    >
    settings.kerf
  ) {

    sheet.cuts.push({

      direction:
        "vertical",

      x,

      y:
        settings.startY,

      length:
        settings.usableHeight,

      kerf:
        settings.kerf

    });


    sheet.offcuts.push({

      x:
        x
        +
        settings.kerf,

      y:
        settings.startY,

      width:
        remainRight
        -
        settings.kerf,

      height:
        settings.usableHeight

    });

  }

}



/* =========================================================
   후보 생성
========================================================= */

function makeCandidate(
  parts,
  direction,
  strategy,
  ascending,
  settings
) {

  const oriented =
    orientParts(

      parts,

      direction,

      strategy,

      settings

    );


  if (
    !oriented
  ) {

    return null;

  }


  const strips =
    createStrips(

      oriented,

      direction,

      settings,

      ascending

    );


  const sheets =
    packSheets(

      strips,

      direction,

      settings

    );


  sheets.forEach(
    sheet => {


      if (
        direction
        ===
        "horizontal"
      ) {

        layoutHorizontal(
          sheet,
          settings
        );

      }

      else {

        layoutVertical(
          sheet,
          settings
        );

      }

    }
  );


  const cuts =
    sheets.reduce(
      (
        total,
        sheet
      ) =>
        total
        +
        sheet.cuts.length,
      0
    );


  const offcuts =
    sheets.flatMap(
      sheet =>
        sheet.offcuts
    );


  const largestOffcut =
    offcuts.reduce(
      (
        max,
        offcut
      ) =>
        Math.max(
          max,
          offcut.width
          *
          offcut.height
        ),
      0
    );


  return {

    direction,

    strategy,

    ascending,

    sheets,

    cuts,

    largestOffcut

  };

}



/* =========================================================
   후보 비교
========================================================= */

function compareCandidates(
  a,
  b
) {

  if (
    a.sheets.length
    !==
    b.sheets.length
  ) {

    return (
      a.sheets.length
      -
      b.sheets.length
    );

  }


  if (
    a.largestOffcut
    !==
    b.largestOffcut
  ) {

    return (
      b.largestOffcut
      -
      a.largestOffcut
    );

  }


  return (
    a.cuts
    -
    b.cuts
  );

}



/* =========================================================
   동일 원장 패턴
========================================================= */

function makeSheetPatternKey(
  sheet,
  direction
) {

  const stripKeys =
    sheet.strips.map(
      strip => {


        const parts =
          strip.parts.map(
            part => [

              part.name,

              roundKey(
                part.originalWidth
              ),

              roundKey(
                part.originalHeight
              ),

              roundKey(
                part.width
              ),

              roundKey(
                part.height
              ),

              part.rotated
              ?
              1
              :
              0

            ].join(":")
          );


        return [

          direction,

          roundKey(
            strip.thickness
          ),

          parts.join(",")

        ].join("|");

      }
    );


  const offcuts =
    sheet.offcuts
      .map(
        offcut => [

          roundKey(
            offcut.width
          ),

          roundKey(
            offcut.height
          )

        ].join("x")
      )
      .sort();


  return [

    stripKeys.join("||"),

    offcuts.join(",")

  ].join("###");

}


function groupSameSheets(
  sheets,
  direction
) {

  const groups =
    [];


  const map =
    new Map();


  sheets.forEach(
    (
      sheet,
      sheetIndex
    ) => {


      const key =
        makeSheetPatternKey(
          sheet,
          direction
        );


      if (
        map.has(key)
      ) {

        const group =
          map.get(key);


        group.count +=
          1;


        group.sheetIndexes.push(
          sheetIndex + 1
        );

      }

      else {

        const group = {

          key,

          sheet,

          count:
            1,

          sheetIndexes:
            [
              sheetIndex + 1
            ]

        };


        map.set(
          key,
          group
        );


        groups.push(
          group
        );

      }

    }
  );


  groups.forEach(
    (
      group,
      index
    ) => {


      group.patternName =
        String.fromCharCode(
          65 + index
        );

    }
  );


  return groups;

}



/* =========================================================
   계산
========================================================= */

function calculate() {

  resetPartColors();


  const result =
    document.getElementById(
      "result"
    );


  const optimizationInfo =
    document.getElementById(
      "optimizationInfo"
    );


  const cutSequence =
    document.getElementById(
      "cutSequence"
    );


  const layoutArea =
    document.getElementById(
      "layoutArea"
    );


  result.innerHTML =
    "";


  optimizationInfo.innerHTML =
    "";


  cutSequence.innerHTML =
    "";


  layoutArea.innerHTML =
    "";


  const settings =
    getSheetSettings();


  const parts =
    readParts();


  const mode =
    getCutMode();


  if (
    settings.sheetWidth <= 0
    ||
    settings.sheetHeight <= 0
  ) {

    showError(
      "원장 규격을 확인해주세요."
    );

    return;

  }


  if (
    settings.usableWidth <= 0
    ||
    settings.usableHeight <= 0
  ) {

    showError(
      "가재단 후 사용 가능한 원장 크기가 없습니다."
    );

    return;

  }


  if (
    !parts.length
  ) {

    showError(
      "부재를 입력해주세요."
    );

    return;

  }


  for (
    const part
    of parts
  ) {


    const normalFit =
      part.originalWidth
      <=
      settings.usableWidth

      &&

      part.originalHeight
      <=
      settings.usableHeight;


    const rotatedFit =
      part.canRotate

      &&

      part.originalHeight
      <=
      settings.usableWidth

      &&

      part.originalWidth
      <=
      settings.usableHeight;


    if (
      !normalFit
      &&
      !rotatedFit
    ) {

      showError(

        `${part.name} ${formatNumber(
          part.originalWidth
        )} × ${formatNumber(
          part.originalHeight
        )}mm 부재가 원장에 들어가지 않습니다.`

      );


      return;

    }

  }


  const candidates =
    [];


  let directions;

  let strategies;


  if (
    mode
    ===
    "grain"
  ) {

    directions = [
      "vertical"
    ];


    strategies = [
      "original"
    ];

  }

  else {

    directions = [

      "horizontal",

      "vertical"

    ];


    strategies = [

      "original",

      "rotated",

      "thin",

      "long"

    ];

  }


  directions.forEach(
    direction => {


      strategies.forEach(
        strategy => {


          [
            false,
            true
          ].forEach(
            ascending => {


              const candidate =
                makeCandidate(

                  parts,

                  direction,

                  strategy,

                  ascending,

                  settings

                );


              if (
                candidate
              ) {

                candidates.push(
                  candidate
                );

              }

            }
          );

        }
      );

    }
  );


  if (
    !candidates.length
  ) {

    showError(
      "재단 가능한 배치를 찾지 못했습니다."
    );

    return;

  }


  candidates.sort(
    compareCandidates
  );


  const best =
    candidates[0];


  best.patternGroups =
    groupSameSheets(
      best.sheets,
      best.direction
    );


  /*
     마지막 결과 저장
  */

  lastBestResult =
    best;


  lastSheetSettings =
    settings;


  showResult(

    best,

    parts,

    settings,

    mode

  );


  drawCutGuide(
    best,
    settings
  );


  drawSheets(
    best,
    settings,
    false
  );

}



/* =========================================================
   계산 결과

   비교 후보 삭제
========================================================= */

function showResult(
  best,
  parts,
  settings,
  mode
) {

  const directionText =
    best.direction
    ===
    "vertical"

    ?

    "길이 방향 우선"

    :

    "폭 방향 우선";


  const duplicateSheets =
    best.sheets.length
    -
    best.patternGroups.length;


  document.getElementById(
    "result"
  ).innerHTML = `

    <div class="summary-box">

      <h2>
        계산 결과
      </h2>


      <div class="summary-grid">


        <div class="summary-item">

          <span>
            필요 원장
          </span>

          <strong>
            ${best.sheets.length}장
          </strong>

        </div>


        <div class="summary-item">

          <span>
            서로 다른 배치
          </span>

          <strong>
            ${best.patternGroups.length}개
          </strong>

        </div>


        <div class="summary-item">

          <span>
            중복 원장
          </span>

          <strong>
            ${duplicateSheets}장
          </strong>

        </div>


        <div class="summary-item">

          <span>
            총 부재
          </span>

          <strong>
            ${parts.length}개
          </strong>

        </div>


        <div class="summary-item">

          <span>
            1차 재단
          </span>

          <strong>
            ${directionText}
          </strong>

        </div>


        <div class="summary-item">

          <span>
            톱날 두께
          </span>

          <strong>

            ${formatNumber(
              settings.kerf
            )}mm

          </strong>

        </div>


        <div class="summary-item">

          <span>
            재단 모드
          </span>

          <strong>

            ${
              mode
              ===
              "grain"

              ?

              "결방향 고려"

              :

              "결방향 자유"
            }

          </strong>

        </div>


      </div>

    </div>

  `;


  const patterns =
    best.patternGroups
      .map(
        group =>
          `패턴 ${group.patternName} × ${group.count}장`
      )
      .join(
        " &nbsp;&nbsp;/&nbsp;&nbsp; "
      );


  document.getElementById(
    "optimizationInfo"
  ).innerHTML = `

    <div class="summary-box">

      <strong>
        동일 배치 자동 묶기
      </strong>

      <div
        style="
          margin-top:10px;
          line-height:1.8;
        "
      >

        ${patterns}

      </div>

    </div>

  `;

}



/* =========================================================
   먼저 재단할 치수
========================================================= */

function drawCutGuide(
  best,
  settings
) {

  const target =
    document.getElementById(
      "cutSequence"
    );


  target.innerHTML =
    "";


  best.patternGroups.forEach(
    group => {


      const sheet =
        group.sheet;


      const box =
        document.createElement(
          "div"
        );


      box.className =
        "cut-sheet";


      let html = `

        <h3>

          패턴 ${group.patternName}

          × ${group.count}장

        </h3>

      `;


      if (
        settings.trimEnabled
      ) {

        html += `

          <div class="cut-group">

            <strong>
              작업 시작 전 가재단
            </strong>

            <div class="cut-line">

              가재단

              ${formatNumber(
                settings.trimAmount
              )}mm

              +

              톱날 두께

              ${formatNumber(
                settings.kerf
              )}mm

              =

              시작 오프셋

              <b>

                ${formatNumber(
                  settings.trimOffset
                )}mm

              </b>

            </div>

          </div>

        `;

      }


      if (
        best.direction
        ===
        "vertical"
      ) {

        html += `

          <div class="cut-group">

            <strong>
              먼저 재단
            </strong>

            <div class="cut-line first-cut-highlight">

              ${formatNumber(
                settings.usableHeight
              )}mm 길이를 유지한 상태에서

              폭을 먼저 재단

            </div>

          </div>


          <div class="cut-group">

            <strong>
              1차 재단 폭
            </strong>

        `;


        sheet.strips.forEach(
          (
            strip,
            index
          ) => {


            html += `

              <div class="cut-line">

                ${index + 1}번째 :

                <b>

                  ${formatNumber(
                    strip.width
                  )}mm

                </b>

                ${
                  index
                  <
                  sheet.strips.length
                  -
                  1

                  ?

                  ` → 톱날 ${formatNumber(
                    settings.kerf
                  )}mm`

                  :

                  ""
                }

              </div>

            `;

          }
        );


        html += `

          </div>

        `;


        sheet.strips.forEach(
          (
            strip,
            stripIndex
          ) => {


            html += `

              <div class="cut-group">

                <strong>

                  스트립
                  ${stripIndex + 1}

                  다음 재단

                </strong>

            `;


            strip.parts.forEach(
              (
                part,
                index
              ) => {


                html += `

                  <div class="cut-line">

                    ${index + 1}번째 :

                    ${part.name}

                    →

                    <b>

                      ${formatNumber(
                        part.height
                      )}mm

                    </b>

                  </div>

                `;

              }
            );


            html += `

              </div>

            `;

          }
        );

      }

      else {

        html += `

          <div class="cut-group">

            <strong>
              먼저 재단
            </strong>

            <div class="cut-line first-cut-highlight">

              아래 스트립 치수로 먼저 재단

            </div>

          </div>


          <div class="cut-group">

            <strong>
              1차 재단 치수
            </strong>

        `;


        sheet.strips.forEach(
          (
            strip,
            index
          ) => {


            html += `

              <div class="cut-line">

                ${index + 1}번째 :

                <b>

                  ${formatNumber(
                    strip.height
                  )}mm

                </b>

                ${
                  index
                  <
                  sheet.strips.length
                  -
                  1

                  ?

                  ` → 톱날 ${formatNumber(
                    settings.kerf
                  )}mm`

                  :

                  ""
                }

              </div>

            `;

          }
        );


        html += `

          </div>

        `;


        sheet.strips.forEach(
          (
            strip,
            stripIndex
          ) => {


            html += `

              <div class="cut-group">

                <strong>

                  스트립
                  ${stripIndex + 1}

                  다음 재단

                </strong>

            `;


            strip.parts.forEach(
              (
                part,
                index
              ) => {


                html += `

                  <div class="cut-line">

                    ${index + 1}번째 :

                    ${part.name}

                    →

                    <b>

                      ${formatNumber(
                        part.width
                      )}mm

                    </b>

                  </div>

                `;

              }
            );


            html += `

              </div>

            `;

          }
        );

      }


      if (
        group.count > 1
      ) {

        html += `

          <div class="cut-group">

            <strong>
              동일 원장 반복
            </strong>

            <div class="cut-line">

              이 방식으로

              <b>

                총 ${group.count}장

              </b>

              동일하게 재단

            </div>

          </div>

        `;

      }


      box.innerHTML =
        html;


      target.appendChild(
        box
      );

    }
  );

}



/* =========================================================
   실제 좌표 → 화면 좌표
========================================================= */

function realRectToDisplay(
  rect,
  settings,
  scale
) {

  return {

    left:
      rect.y
      *
      scale,

    top:
      (
        settings.sheetWidth
        -
        rect.x
        -
        rect.width
      )
      *
      scale,

    width:
      rect.height
      *
      scale,

    height:
      rect.width
      *
      scale

  };

}



/* =========================================================
   사각형
========================================================= */

function drawRectangle(
  parent,
  rect,
  settings,
  scale,
  className,
  text
) {

  if (
    rect.width <= 0
    ||
    rect.height <= 0
  ) {

    return null;

  }


  const d =
    realRectToDisplay(
      rect,
      settings,
      scale
    );


  const el =
    document.createElement(
      "div"
    );


  el.className =
    className;


  el.style.left =
    `${d.left}px`;


  el.style.top =
    `${d.top}px`;


  el.style.width =
    `${d.width}px`;


  el.style.height =
    `${d.height}px`;


  el.innerHTML =
    text || "";


  parent.appendChild(
    el
  );


  return el;

}



/* =========================================================
   톱날 두께 표시
========================================================= */

function drawKerf(
  parent,
  cut,
  settings,
  scale
) {

  const rect =
    cut.direction
    ===
    "vertical"

    ?

    {

      x:
        cut.x,

      y:
        cut.y,

      width:
        cut.kerf,

      height:
        cut.length

    }

    :

    {

      x:
        cut.x,

      y:
        cut.y,

      width:
        cut.length,

      height:
        cut.kerf

    };


  const d =
    realRectToDisplay(
      rect,
      settings,
      scale
    );


  const el =
    document.createElement(
      "div"
    );


  el.className =
    "kerf-band";


  el.style.left =
    `${d.left}px`;


  el.style.top =
    `${d.top}px`;


  el.style.width =
    `${Math.max(
      1,
      d.width
    )}px`;


  el.style.height =
    `${Math.max(
      1,
      d.height
    )}px`;


  parent.appendChild(
    el
  );

}



/* =========================================================
   가재단 표시
========================================================= */

function drawTrim(
  parent,
  settings,
  scale
) {

  if (
    !settings.trimEnabled
  ) {

    return;

  }


  if (
    settings.trimDirection
    ===
    "width"
  ) {

    drawRectangle(

      parent,

      {

        x:
          0,

        y:
          0,

        width:
          settings.trimAmount,

        height:
          settings.sheetHeight

      },

      settings,

      scale,

      "trim-band",

      ""

    );


    drawKerf(

      parent,

      {

        direction:
          "vertical",

        x:
          settings.trimAmount,

        y:
          0,

        length:
          settings.sheetHeight,

        kerf:
          settings.kerf

      },

      settings,

      scale

    );

  }

  else {

    drawRectangle(

      parent,

      {

        x:
          0,

        y:
          0,

        width:
          settings.sheetWidth,

        height:
          settings.trimAmount

      },

      settings,

      scale,

      "trim-band",

      ""

    );


    drawKerf(

      parent,

      {

        direction:
          "horizontal",

        x:
          0,

        y:
          settings.trimAmount,

        length:
          settings.sheetWidth,

        kerf:
          settings.kerf

      },

      settings,

      scale

    );

  }

}



/* =========================================================
   범례
========================================================= */

function getLegendItems(sheet) {

  const map =
    new Map();


  sheet.parts.forEach(
    part => {


      const key =
        getPartSizeKey(
          part
        );


      if (
        !map.has(key)
      ) {

        map.set(
          key,
          {

            width:
              part.originalWidth,

            height:
              part.originalHeight,

            names:
              new Set(),

            color:
              getPartColor(
                part
              )

          }
        );

      }


      map
        .get(key)
        .names
        .add(
          part.name
        );

    }
  );


  return Array.from(
    map.values()
  );

}


function drawLegend(
  wrap,
  sheet
) {

  const items =
    getLegendItems(
      sheet
    );


  const legend =
    document.createElement(
      "div"
    );


  legend.className =
    "part-legend";


  items.forEach(
    item => {


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "legend-item";


      const color =
        document.createElement(
          "span"
        );


      color.className =
        "legend-color";


      color.style.backgroundColor =
        item.color;


      const text =
        document.createElement(
          "span"
        );


      const names =
        Array.from(
          item.names
        ).join(
          " / "
        );


      text.textContent =

        `${names} · ${formatNumber(
          item.width
        )} × ${formatNumber(
          item.height
        )}mm`;


      row.appendChild(
        color
      );


      row.appendChild(
        text
      );


      legend.appendChild(
        row
      );

    }
  );


  wrap.appendChild(
    legend
  );

}



/* =========================================================
   배치도

   forPrint = false
   → 화면용

   forPrint = true
   → PDF용 1000px
========================================================= */

function drawSheets(
  best,
  settings,
  forPrint = false
) {

  const target =
    document.getElementById(
      "layoutArea"
    );


  target.innerHTML =
    "";


  let maxWidth;


  /*
     PDF
  */

  if (
    forPrint
  ) {

    maxWidth =
      1000;

  }


  /*
     모바일
  */

  else if (
    window.innerWidth
    <=
    650
  ) {

    const layoutCard =
      document.querySelector(
        ".layout-card"
      );


    const availableWidth =
      layoutCard
      ?
      layoutCard.clientWidth
      -
      22
      :
      window.innerWidth
      -
      36;


    maxWidth =
      Math.max(
        250,
        availableWidth
      );

  }


  /*
     PC
  */

  else {

    maxWidth =
      1000;

  }


  const scale =
    Math.min(

      maxWidth
      /
      settings.sheetHeight,

      0.8

    );


  const displayWidth =
    settings.sheetHeight
    *
    scale;


  const displayHeight =
    settings.sheetWidth
    *
    scale;


  best.patternGroups.forEach(
    group => {


      const sheet =
        group.sheet;


      const wrap =
        document.createElement(
          "div"
        );


      wrap.className =
        "sheet-wrap";


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "sheet-title";


      title.innerHTML = `

        패턴 ${group.patternName}

        × ${group.count}장

        &nbsp;·&nbsp;

        ${formatNumber(
          settings.sheetWidth
        )}

        ×

        ${formatNumber(
          settings.sheetHeight
        )}mm

      `;


      wrap.appendChild(
        title
      );


      /*
         색상 범례
      */

      drawLegend(
        wrap,
        sheet
      );


      const sheetEl =
        document.createElement(
          "div"
        );


      sheetEl.className =
        "sheet";


      sheetEl.style.width =
        `${displayWidth}px`;


      sheetEl.style.height =
        `${displayHeight}px`;


      /*
         가재단
      */

      drawTrim(

        sheetEl,

        settings,

        scale

      );


      /*
         자투리
      */

      sheet.offcuts.forEach(
        offcut => {


          drawRectangle(

            sheetEl,

            offcut,

            settings,

            scale,

            "offcut",

            `${formatNumber(
              offcut.width
            )} × ${formatNumber(
              offcut.height
            )}`

          );

        }
      );


      /*
         톱날 두께
      */

      sheet.cuts.forEach(
        cut => {


          drawKerf(

            sheetEl,

            cut,

            settings,

            scale

          );

        }
      );


      /*
         부재
      */

      sheet.parts.forEach(
        part => {


          const text =

            `${part.name}`

            +

            `<br>`

            +

            `${formatNumber(
              part.originalWidth
            )} × ${formatNumber(
              part.originalHeight
            )}`

            +

            (

              part.rotated

              ?

              `<br>↻`

              :

              ""

            );


          const partElement =
            drawRectangle(

              sheetEl,

              {

                x:
                  part.x,

                y:
                  part.y,

                width:
                  part.width,

                height:
                  part.height

              },

              settings,

              scale,

              "part",

              text

            );


          if (
            partElement
          ) {

            partElement.style.backgroundColor =
              getPartColor(
                part
              );

          }

        }
      );


      /*
         스트립 번호
      */

      sheet.strips.forEach(
        strip => {


          const d =
            realRectToDisplay(

              {

                x:
                  strip.x,

                y:
                  strip.y,

                width:
                  strip.width,

                height:
                  strip.height

              },

              settings,

              scale

            );


          const label =
            document.createElement(
              "div"
            );


          label.className =
            "strip-label";


          label.style.left =
            `${d.left + 3}px`;


          label.style.top =
            `${d.top + 3}px`;


          label.textContent =
            `S${strip.index}`;


          sheetEl.appendChild(
            label
          );

        }
      );


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "sheet-meta";


      meta.innerHTML = `

        동일 배치 :

        <strong>

          ${group.count}장

        </strong>

        &nbsp;·&nbsp;

        스트립 :

        ${sheet.strips.length}개

        &nbsp;·&nbsp;

        부재 :

        ${sheet.parts.length}개

      `;


      wrap.appendChild(
        sheetEl
      );


      wrap.appendChild(
        meta
      );


      target.appendChild(
        wrap
      );

    }
  );

}



/* =========================================================
   PDF 출력

   모바일에서도
   PDF 출력 직전 1000px로 다시 그림
========================================================= */

function exportPDF() {

  if (
    !lastBestResult
    ||
    !lastSheetSettings
  ) {

    alert(
      "먼저 재단 최적화 계산을 실행해주세요."
    );

    return;

  }


  /*
     PDF용 큰 배치도로 다시 그림
  */

  drawSheets(

    lastBestResult,

    lastSheetSettings,

    true

  );


  /*
     브라우저가 다시 그린 후
     인쇄창 실행
  */

  setTimeout(
    () => {

      window.print();

    },
    100
  );

}



/* =========================================================
   PDF 종료 후
   현재 화면 크기에 맞게 다시 그림
========================================================= */

window.addEventListener(
  "afterprint",
  () => {


    if (
      lastBestResult
      &&
      lastSheetSettings
    ) {

      drawSheets(

        lastBestResult,

        lastSheetSettings,

        false

      );

    }

  }
);



/* =========================================================
   화면 크기 변경
========================================================= */

let resizeTimer = null;


window.addEventListener(
  "resize",
  () => {


    clearTimeout(
      resizeTimer
    );


    resizeTimer =
      setTimeout(
        () => {


          if (
            lastBestResult
            &&
            lastSheetSettings
          ) {

            drawSheets(

              lastBestResult,

              lastSheetSettings,

              false

            );

          }

        },
        150
      );

  }
);



/* =========================================================
   기타
========================================================= */

function formatNumber(value) {

  if (
    Math.abs(
      value
      -
      Math.round(value)
    )
    <
    0.0001
  ) {

    return String(
      Math.round(value)
    );

  }


  return Number(value)
    .toFixed(1)
    .replace(
      /\.0$/,
      ""
    );

}


function roundKey(value) {

  return (
    Math.round(
      Number(value)
      *
      10
    )
    /
    10
  );

}


function showError(message) {

  document.getElementById(
    "result"
  ).innerHTML = `

    <div class="error-box">

      ${message}

    </div>

  `;


  document.getElementById(
    "cutSequence"
  ).innerHTML =
    "계산할 수 없습니다.";


  document.getElementById(
    "layoutArea"
  ).innerHTML =
    "계산할 수 없습니다.";


  lastBestResult =
    null;


  lastSheetSettings =
    null;

}



/* =========================================================
   이벤트
========================================================= */

document
  .getElementById(
    "sheetWidth"
  )
  .addEventListener(
    "input",
    updateTrimInfo
  );


document
  .getElementById(
    "sheetHeight"
  )
  .addEventListener(
    "input",
    updateTrimInfo
  );


document
  .getElementById(
    "kerf"
  )
  .addEventListener(
    "input",
    updateTrimInfo
  );



/* =========================================================
   시작
========================================================= */

updateCutMode();

updateTrimUI();