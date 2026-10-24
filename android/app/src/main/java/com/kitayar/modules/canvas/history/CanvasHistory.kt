package com.kitayar.modules.canvas.history

import com.kitayar.modules.canvas.model.CanvasDocument
import com.kitayar.modules.canvas.model.CanvasElement
import java.util.ArrayDeque

interface CanvasCommand {
    fun execute()
    fun undo()
    fun redo() = execute()
}

class AddElementCommand(
    private val document: CanvasDocument,
    private val element: CanvasElement
) : CanvasCommand {
    override fun execute() {
        document.addElement(element)
    }

    override fun undo() {
        document.removeElement(element.id)
    }
}

class RemoveElementCommand(
    private val document: CanvasDocument,
    private val element: CanvasElement
) : CanvasCommand {
    private var oldZIndex: Int = element.zIndex

    override fun execute() {
        oldZIndex = element.zIndex
        document.removeElement(element.id)
    }

    override fun undo() {
        element.zIndex = oldZIndex
        document.addElement(element)
    }
}

class TransformElementsCommand(
    private val document: CanvasDocument,
    private val beforeStates: List<CanvasElement>,
    private val afterStates: List<CanvasElement>
) : CanvasCommand {

    override fun execute() {
        applyState(afterStates)
    }

    override fun undo() {
        applyState(beforeStates)
    }

    private fun applyState(states: List<CanvasElement>) {
        for (state in states) {
            val existingIdx = document.elements.indexOfFirst { it.id == state.id }
            if (existingIdx != -1) {
                document.elements[existingIdx] = state.clone()
            }
        }
    }
}

class BatchCommand(
    private val commands: List<CanvasCommand>
) : CanvasCommand {
    override fun execute() {
        for (cmd in commands) cmd.execute()
    }

    override fun undo() {
        for (cmd in commands.asReversed()) cmd.undo()
    }
}

class CanvasHistory(
    private val maxDepth: Int = 50,
    var onHistoryChanged: (() -> Unit)? = null
) {
    private val undoStack: ArrayDeque<CanvasCommand> = ArrayDeque()
    private val redoStack: ArrayDeque<CanvasCommand> = ArrayDeque()

    val canUndo: Boolean get() = undoStack.isNotEmpty()
    val canRedo: Boolean get() = redoStack.isNotEmpty()

    fun push(command: CanvasCommand, executeNow: Boolean = true) {
        if (executeNow) {
            command.execute()
        }
        if (undoStack.size >= maxDepth) {
            undoStack.removeLast()
        }
        undoStack.push(command)
        redoStack.clear()
        onHistoryChanged?.invoke()
    }

    fun undo(): Boolean {
        if (undoStack.isEmpty()) return false
        val cmd = undoStack.pop()
        cmd.undo()
        redoStack.push(cmd)
        onHistoryChanged?.invoke()
        return true
    }

    fun redo(): Boolean {
        if (redoStack.isEmpty()) return false
        val cmd = redoStack.pop()
        cmd.redo()
        undoStack.push(cmd)
        onHistoryChanged?.invoke()
        return true
    }

    fun clear() {
        undoStack.clear()
        redoStack.clear()
        onHistoryChanged?.invoke()
    }
}
