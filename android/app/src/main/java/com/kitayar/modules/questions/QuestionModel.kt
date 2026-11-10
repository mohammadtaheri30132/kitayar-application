package com.kitayar.modules.questions

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

data class QuestionItem(
    val id: String,
    val question: String,
    val mainQuestion: String? = null,
    val type: String? = "تستی",
    val difficulty: String? = "متوسط",
    val options: List<String> = emptyList(),
    val answer: String? = null,
    val sourceImage: String? = null,
    val origin: String? = null
) {
    companion object {
        private fun sanitizeString(str: String?): String? {
            if (str.isNullOrBlank()) return null
            val trimmed = str.trim()
            if (trimmed.equals("null", ignoreCase = true) || trimmed.equals("undefined", ignoreCase = true)) {
                return null
            }
            return trimmed
        }

        fun fromReadableMap(map: ReadableMap): QuestionItem? {
            val id = if (map.hasKey("_id")) map.getString("_id")
                     else if (map.hasKey("id")) map.getString("id")
                     else null

            if (id == null) return null

            val question = if (map.hasKey("question")) map.getString("question") ?: "" else ""
            val mainQuestion = if (map.hasKey("mainQuestion")) sanitizeString(map.getString("mainQuestion")) else null
            val type = if (map.hasKey("type")) map.getString("type") else "تستی"
            val difficulty = if (map.hasKey("difficulty")) map.getString("difficulty") else "متوسط"
            val answer = if (map.hasKey("answer")) sanitizeString(map.getString("answer")) else null
            val sourceImage = if (map.hasKey("source_image")) sanitizeString(map.getString("source_image")) else null
            val origin = if (map.hasKey("origin")) map.getString("origin") else null

            val optionsList = mutableListOf<String>()
            if (map.hasKey("options")) {
                val opts = map.getArray("options")
                if (opts != null) {
                    for (i in 0 until opts.size()) {
                        val opt = opts.getString(i)
                        val sanitized = sanitizeString(opt)
                        if (!sanitized.isNullOrBlank()) {
                            optionsList.add(sanitized)
                        }
                    }
                }
            }

            return QuestionItem(
                id = id,
                question = question,
                mainQuestion = mainQuestion,
                type = type,
                difficulty = difficulty,
                options = optionsList,
                answer = answer,
                sourceImage = sourceImage,
                origin = origin
            )
        }

        fun fromReadableArray(array: ReadableArray): List<QuestionItem> {
            val list = mutableListOf<QuestionItem>()
            for (i in 0 until array.size()) {
                val map = array.getMap(i)
                if (map != null) {
                    val item = fromReadableMap(map)
                    if (item != null) {
                        list.add(item)
                    }
                }
            }
            return list
        }
    }
}
