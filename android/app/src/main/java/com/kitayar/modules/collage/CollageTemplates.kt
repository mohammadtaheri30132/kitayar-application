package com.kitayar.modules.collage

import android.graphics.RectF

object CollageTemplates {
    // هر قالب شامل لیستی از مستطیل‌هاست. اعداد نمایانگر درصد از ابعاد کل هستند (0.0 تا 1.0)
    fun getTemplatesForCount(count: Int): List<List<RectF>> {
        return when (count) {
            2 -> listOf(
                // 1. نصف افقی
                listOf(RectF(0f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 1f, 1f)),
                // 2. نصف عمودی
                listOf(RectF(0f, 0f, 0.5f, 1f), RectF(0.5f, 0f, 1f, 1f)),
                // 3. افقی نامتقارن (30 بالا، 70 پایین)
                listOf(RectF(0f, 0f, 1f, 0.3f), RectF(0f, 0.3f, 1f, 1f)),
                // 4. افقی نامتقارن (70 بالا، 30 پایین)
                listOf(RectF(0f, 0f, 1f, 0.7f), RectF(0f, 0.7f, 1f, 1f)),
                // 5. عمودی نامتقارن (30 چپ، 70 راست)
                listOf(RectF(0f, 0f, 0.3f, 1f), RectF(0.3f, 0f, 1f, 1f))
            )
            3 -> listOf(
                // 1. سه سطر مساوی
                listOf(RectF(0f, 0f, 1f, 0.33f), RectF(0f, 0.33f, 1f, 0.66f), RectF(0f, 0.66f, 1f, 1f)),
                // 2. یک بالا، دو تا پایین
                listOf(RectF(0f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.5f, 1f), RectF(0.5f, 0.5f, 1f, 1f)),
                // 3. دو تا بالا، یک پایین
                listOf(RectF(0f, 0f, 0.5f, 0.5f), RectF(0.5f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 1f, 1f)),
                // 4. یک چپ، دو تا راست
                listOf(RectF(0f, 0f, 0.5f, 1f), RectF(0.5f, 0f, 1f, 0.5f), RectF(0.5f, 0.5f, 1f, 1f)),
                // 5. دو تا چپ، یک راست
                listOf(RectF(0f, 0f, 0.5f, 0.5f), RectF(0f, 0.5f, 0.5f, 1f), RectF(0.5f, 0f, 1f, 1f))
            )
            4 -> listOf(
                // 1. شبکه 2x2
                listOf(RectF(0f, 0f, 0.5f, 0.5f), RectF(0.5f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.5f, 1f), RectF(0.5f, 0.5f, 1f, 1f)),
                // 2. یک بزرگ بالا، سه کوچک پایین
                listOf(RectF(0f, 0f, 1f, 0.6f), RectF(0f, 0.6f, 0.33f, 1f), RectF(0.33f, 0.6f, 0.66f, 1f), RectF(0.66f, 0.6f, 1f, 1f)),
                // 3. سه کوچک بالا، یک بزرگ پایین
                listOf(RectF(0f, 0f, 0.33f, 0.4f), RectF(0.33f, 0f, 0.66f, 0.4f), RectF(0.66f, 0f, 1f, 0.4f), RectF(0f, 0.4f, 1f, 1f)),
                // 4. یک بزرگ چپ، سه کوچک راست
                listOf(RectF(0f, 0f, 0.6f, 1f), RectF(0.6f, 0f, 1f, 0.33f), RectF(0.6f, 0.33f, 1f, 0.66f), RectF(0.6f, 0.66f, 1f, 1f)),
                // 5. چهار سطر مساوی
                listOf(RectF(0f, 0f, 1f, 0.25f), RectF(0f, 0.25f, 1f, 0.5f), RectF(0f, 0.5f, 1f, 0.75f), RectF(0f, 0.75f, 1f, 1f))
            )
            5 -> listOf(
                // 1. دو بالا، سه پایین
                listOf(RectF(0f, 0f, 0.5f, 0.5f), RectF(0.5f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.33f, 1f), RectF(0.33f, 0.5f, 0.66f, 1f), RectF(0.66f, 0.5f, 1f, 1f)),
                // 2. یک بزرگ وسط، چهار تا اطراف (بالا و پایین)
                listOf(RectF(0f, 0f, 0.5f, 0.25f), RectF(0.5f, 0f, 1f, 0.25f), RectF(0f, 0.25f, 1f, 0.75f), RectF(0f, 0.75f, 0.5f, 1f), RectF(0.5f, 0.75f, 1f, 1f)),
                // 3. سه بالا، دو پایین
                listOf(RectF(0f, 0f, 0.33f, 0.5f), RectF(0.33f, 0f, 0.66f, 0.5f), RectF(0.66f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.5f, 1f), RectF(0.5f, 0.5f, 1f, 1f)),
                // 4. یک بزرگ چپ، چهار کوچک راست (2x2)
                listOf(RectF(0f, 0f, 0.5f, 1f), RectF(0.5f, 0f, 1f, 0.25f), RectF(0.5f, 0.25f, 1f, 0.5f), RectF(0.5f, 0.5f, 1f, 0.75f), RectF(0.5f, 0.75f, 1f, 1f)),
                // 5. پنج سطر افقی
                listOf(RectF(0f, 0f, 1f, 0.2f), RectF(0f, 0.2f, 1f, 0.4f), RectF(0f, 0.4f, 1f, 0.6f), RectF(0f, 0.6f, 1f, 0.8f), RectF(0f, 0.8f, 1f, 1f))
            )
            6 -> listOf(
                // 1. شبکه 3x2
                listOf(RectF(0f, 0f, 0.33f, 0.5f), RectF(0.33f, 0f, 0.66f, 0.5f), RectF(0.66f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.33f, 1f), RectF(0.33f, 0.5f, 0.66f, 1f), RectF(0.66f, 0.5f, 1f, 1f)),
                // 2. شبکه 2x3
                listOf(RectF(0f, 0f, 0.5f, 0.33f), RectF(0.5f, 0f, 1f, 0.33f), RectF(0f, 0.33f, 0.5f, 0.66f), RectF(0.5f, 0.33f, 1f, 0.66f), RectF(0f, 0.66f, 0.5f, 1f), RectF(0.5f, 0.66f, 1f, 1f)),
                // 3. یک بزرگ بالا، 5 کوچک پایین
                listOf(RectF(0f, 0f, 1f, 0.6f), RectF(0f, 0.6f, 0.2f, 1f), RectF(0.2f, 0.6f, 0.4f, 1f), RectF(0.4f, 0.6f, 0.6f, 1f), RectF(0.6f, 0.6f, 0.8f, 1f), RectF(0.8f, 0.6f, 1f, 1f)),
                // 4. دو بزرگ چپ و راست بالا، چهار کوچک پایین
                listOf(RectF(0f, 0f, 0.5f, 0.5f), RectF(0.5f, 0f, 1f, 0.5f), RectF(0f, 0.5f, 0.25f, 1f), RectF(0.25f, 0.5f, 0.5f, 1f), RectF(0.5f, 0.5f, 0.75f, 1f), RectF(0.75f, 0.5f, 1f, 1f)),
                // 5. سه سطر افقی، هر سطر دو ستون
                listOf(RectF(0f, 0f, 0.5f, 0.33f), RectF(0.5f, 0f, 1f, 0.33f), RectF(0f, 0.33f, 0.5f, 0.66f), RectF(0.5f, 0.33f, 1f, 0.66f), RectF(0f, 0.66f, 0.5f, 1f), RectF(0.5f, 0.66f, 1f, 1f))
            )
            else -> emptyList()
        }
    }
}