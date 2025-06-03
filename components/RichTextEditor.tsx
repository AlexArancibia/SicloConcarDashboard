"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Paragraph from "@tiptap/extension-paragraph"
import Link from "@tiptap/extension-link"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import CodeBlock from "@tiptap/extension-code-block"
import Blockquote from "@tiptap/extension-blockquote"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Bold,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  Undo,
  Redo,
  TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Minus,
  Palette,
  Highlighter,
  ImageIcon,
  UnderlineIcon,
  AlignJustify,
  ChevronDown,
  FileCode,
  Wand2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import apiClient from "@/lib/axiosConfig"
import { getImageUrl } from "@/lib/imageUtils"

interface RichTextEditorProps {
  content?: string
  onChange: (content: string) => void
}

const MAX_CONTENT_LENGTH = 10000 // Adjust as needed

// Extensión personalizada para añadir atributos a las celdas de tabla
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {}
          }
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
      textColor: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.textColor) {
            return {}
          }
          return { style: `color: ${attributes.textColor}` }
        },
      },
    }
  },
})

// Extensión personalizada para añadir atributos a las celdas de encabezado
const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {}
          }
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
      textColor: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.textColor) {
            return {}
          }
          return { style: `color: ${attributes.textColor}` }
        },
      },
    }
  },
})

// Extensión personalizada para añadir interlineado a párrafos
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) {
            return {}
          }
          return { style: `line-height: ${attributes.lineHeight}` }
        },
      },
    }
  },
})

// Extensión personalizada para añadir interlineado a encabezados
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) {
            return {}
          }
          return { style: `line-height: ${attributes.lineHeight}` }
        },
      },
    }
  },
})

// Colores predefinidos más intensos y variados
const predefinedColors = [
  // Colores básicos
  { name: "Negro", value: "#000000" },
  { name: "Blanco", value: "#ffffff" },
  { name: "Gris", value: "#808080" },

  // Colores primarios intensos
  { name: "Rojo", value: "#ff0000" },
  { name: "Verde", value: "#00cc00" },
  { name: "Azul", value: "#0000ff" },

  // Colores secundarios intensos
  { name: "Amarillo", value: "#ffcc00" },
  { name: "Naranja", value: "#ff6600" },
  { name: "Púrpura", value: "#9900cc" },
  { name: "Rosa", value: "#ff0099" },
  { name: "Turquesa", value: "#00cccc" },
  { name: "Lima", value: "#99cc00" },

  // Colores corporativos
  { name: "Azul corporativo", value: "#003366" },
  { name: "Rojo corporativo", value: "#990000" },
  { name: "Verde corporativo", value: "#006633" },
]

// Opciones de interlineado
const lineHeightOptions = [
  { label: "Simple", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Doble", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
]

// Función para formatear HTML con indentación
function formatHTML(html: string): string {
  if (!html) return ""

  // Primero, normalizar los saltos de línea
  html = html.replace(/\r\n|\r/g, "\n")

  // Lista de etiquetas que no necesitan indentación interna o nueva línea
  const inlineTags = new Set([
    "a",
    "abbr",
    "acronym",
    "b",
    "bdo",
    "big",
    "br",
    "button",
    "cite",
    "code",
    "dfn",
    "em",
    "i",
    "img",
    "input",
    "kbd",
    "label",
    "map",
    "object",
    "q",
    "samp",
    "script",
    "select",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "textarea",
    "time",
    "tt",
    "var",
  ])

  // Lista de etiquetas que son auto-cerradas
  const selfClosingTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ])

  let formatted = ""
  let indent = ""
  let lastTag = ""
  let isInPreTag = false
  let isInScriptOrStyle = false

  // Dividir el HTML en tokens (etiquetas y texto)
  const tokens = html.match(/<[^>]+>|[^<]+/g) || []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim()

    // Saltar tokens vacíos
    if (!token) continue

    // Verificar si estamos dentro de una etiqueta <pre>, <script> o <style>
    if (token.match(/<pre[^>]*>/i)) isInPreTag = true
    else if (token.match(/<\/pre>/i)) isInPreTag = false

    if (token.match(/<(script|style)[^>]*>/i)) isInScriptOrStyle = true
    else if (token.match(/<\/(script|style)>/i)) isInScriptOrStyle = false

    // Si estamos dentro de pre, script o style, no formatear
    if (isInPreTag || isInScriptOrStyle) {
      formatted += token
      continue
    }

    // Manejar comentarios HTML
    if (token.startsWith("<!--")) {
      formatted += "\n" + indent + token
      if (token.endsWith("-->")) formatted += "\n"
      continue
    }

    // Manejar etiquetas de cierre
    if (token.startsWith("</")) {
      const tagName = token.match(/<\/([a-zA-Z0-9]+)/)?.[1]?.toLowerCase() || ""

      // Reducir la indentación para etiquetas de bloque
      if (!inlineTags.has(tagName)) {
        indent = indent.substring(2)
        formatted += "\n" + indent
      }

      formatted += token
      lastTag = "/" + tagName
    }
    // Manejar etiquetas de apertura
    else if (token.startsWith("<")) {
      const tagMatch = token.match(/<([a-zA-Z0-9]+)/)
      const tagName = tagMatch?.[1]?.toLowerCase() || ""
      const isSelfClosing = selfClosingTags.has(tagName) || token.endsWith("/>") || token.includes(" />")

      // Añadir nueva línea e indentación para etiquetas de bloque
      if (!inlineTags.has(tagName)) {
        formatted += "\n" + indent
      }

      formatted += token
      lastTag = tagName

      // Aumentar la indentación para etiquetas de bloque que no son auto-cerradas
      if (!inlineTags.has(tagName) && !isSelfClosing) {
        indent += "  "
      }
    }
    // Manejar contenido de texto
    else {
      // Eliminar espacios en blanco innecesarios
      const text = token.replace(/\s+/g, " ").trim()
      if (text) {
        // Si el último token fue una etiqueta de bloque, añadir indentación
        if (lastTag && !inlineTags.has(lastTag.replace("/", ""))) {
          formatted += "\n" + indent
        }
        formatted += text
      }
    }
  }

  // Limpiar líneas vacías múltiples
  formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n")

  return formatted.trim()
}

// Extensión personalizada para imágenes con enlaces y ancho
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}${attributes.width.includes("%") || attributes.width.includes("px") ? "" : "px"}`,
          }
        },
      },
      href: {
        default: null,
        parseHTML: (element) => {
          const link = element.closest("a")
          return link ? link.getAttribute("href") : null
        },
        renderHTML: (attributes) => {
          return {}
        },
      },
    }
  },

  renderHTML({ HTMLAttributes, node }) {
    const img: [string, Record<string, any>] = ["img", HTMLAttributes]

    if (node.attrs.href) {
      return [
        "a",
        {
          href: node.attrs.href,
          target: "_blank",
          rel: "noopener noreferrer",
          onclick: "return false;", // Bloquea la redirección en modo edición
          style: "pointer-events: none;", // Desactiva eventos de puntero
        },
        img,
      ]
    }

    return img
  },
})

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [charCount, setCharCount] = useState(0)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageDialogData, setImageDialogData] = useState<{
    file?: File
    url?: string
    width?: string
    href?: string
  }>({})
  const [isInTable, setIsInTable] = useState(false)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
        codeBlock: false,
      }),
      CustomHeading.configure({
        levels: [1, 2, 3],
      }),
      CustomParagraph,
      Link.configure({
        openOnClick: false,
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      // Usamos nuestras extensiones personalizadas en lugar de las originales
      CustomTableHeader,
      CustomTableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight,
      CodeBlock,
      Blockquote,
      HorizontalRule,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] max-w-none p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setCharCount(editor.state.doc.textContent.length)
      setHtmlContent(html)
      onChange(html)
    },
    onSelectionUpdate: ({ editor }) => {
      // Detectar si estamos en una tabla
      const tableActive = editor.isActive("tableCell") || editor.isActive("tableHeader")
      setIsInTable(tableActive)
    },
    onFocus: ({ editor }) => {
      // Detectar si estamos en una tabla al enfocar
      const tableActive = editor.isActive("tableCell") || editor.isActive("tableHeader")
      setIsInTable(tableActive)
    },
  })

  useEffect(() => {
    if (editor && (content || "") !== editor.getHTML()) {
      editor.commands.setContent(content || "")
      setHtmlContent(content || "")
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      setCharCount(editor.state.doc.textContent.length)
      const html = editor.getHTML()
      setHtmlContent(html)
    }
  }, [editor])

  // Formatear el HTML sin aplicar cambios
  const formatHtmlCode = () => {
    if (htmlTextareaRef.current) {
      const formatted = formatHTML(htmlTextareaRef.current.value)
      htmlTextareaRef.current.value = formatted
      setHtmlContent(formatted)
      toast({
        title: "HTML formateado",
        description: "El código ha sido formateado correctamente",
      })
    }
  }

  const toggleHtmlEditor = () => {
    if (showHtmlEditor) {
      // Si estamos cambiando de HTML a visual, actualizar el editor con el HTML actual
      if (htmlTextareaRef.current) {
        const newHtml = htmlTextareaRef.current.value
        editor?.commands.setContent(newHtml)
        onChange(newHtml)
      }
    } else {
      // Si estamos cambiando de visual a HTML, asegurarnos de que el HTML esté actualizado
      const html = editor?.getHTML() || ""
      setHtmlContent(formatHTML(html))
    }
    setShowHtmlEditor(!showHtmlEditor)
  }

  const addLink = () => {
    const url = window.prompt("URL del enlace:")
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addTable = () => {
    if (editor) {
      const rows = prompt("Número de filas:", "3")
      const cols = prompt("Número de columnas:", "3")
      if (rows && cols) {
        editor
          .chain()
          .focus()
          .insertTable({
            rows: Number.parseInt(rows),
            cols: Number.parseInt(cols),
            withHeaderRow: true,
          })
          .run()
      }
    }
  }

  const addImage = useCallback(
    async (file: File, options?: { width?: string; href?: string }) => {
      if (!file || !editor) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("description", "Imagen del contenido")

      try {
        const response = await apiClient.post("/file/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        const imageUrl = response.data.filename

        const imageAttributes: any = { src: getImageUrl(imageUrl) }

        if (options?.width) {
          imageAttributes.width = options.width
        }

        if (options?.href) {
          imageAttributes.href = options.href
        }

        editor.chain().focus().setImage(imageAttributes).run()
        toast({ title: "Éxito", description: "Imagen subida correctamente" })
      } catch (error) {
        console.error("Error al subir la imagen:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo subir la imagen",
        })
      }
    },
    [editor, toast],
  )

  const openImageDialog = (file?: File) => {
    setImageDialogData({ file })
    setIsImageDialogOpen(true)
  }

  const handleImageUpload = () => {
    const { file, width, href } = imageDialogData
    if (file) {
      addImage(file, { width, href })
    }
    setIsImageDialogOpen(false)
    setImageDialogData({})
  }

  const updateSelectedImage = () => {
    if (!editor) return

    const { width, href } = imageDialogData
    const attributes: any = {}

    if (width) attributes.width = width
    if (href !== undefined) attributes.href = href || null

    editor.chain().focus().updateAttributes("image", attributes).run()
    setIsImageDialogOpen(false)
    setImageDialogData({})
  }

  const openImageConfigForSelected = () => {
    if (!editor) return

    const attrs = editor.getAttributes("image")
    setImageDialogData({
      width: attrs.width || "",
      href: attrs.href || "",
    })
    setIsImageDialogOpen(true)
  }

  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run()
  }

  const setHighlight = (color: string) => {
    editor?.chain().focus().toggleHighlight({ color }).run()
  }

  const setCellBackgroundColor = (color: string) => {
    if (!editor) return

    if (editor.isActive("tableCell")) {
      editor.chain().focus().updateAttributes("tableCell", { backgroundColor: color }).run()
    } else if (editor.isActive("tableHeader")) {
      editor.chain().focus().updateAttributes("tableHeader", { backgroundColor: color }).run()
    }
  }

  const setCellTextColor = (color: string) => {
    if (!editor) return

    if (editor.isActive("tableCell")) {
      editor.chain().focus().updateAttributes("tableCell", { textColor: color }).run()
    } else if (editor.isActive("tableHeader")) {
      editor.chain().focus().updateAttributes("tableHeader", { textColor: color }).run()
    }
  }

  const setLineHeight = (height: string) => {
    if (!editor) return

    if (editor.isActive("paragraph")) {
      editor.chain().focus().updateAttributes("paragraph", { lineHeight: height }).run()
    } else if (editor.isActive("heading")) {
      editor.chain().focus().updateAttributes("heading", { lineHeight: height }).run()
    }
  }

  const EditorButton = ({
    onMouseDown,
    icon,
    tooltip,
    isActive = false,
  }: { onMouseDown: () => void; icon: React.ReactNode; tooltip: string; isActive?: boolean }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault()
              onMouseDown()
            }}
            className={`h-8 w-8 p-0 ${isActive ? "editor-button-active" : ""}`}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-muted border-b">
          <div className="flex flex-wrap items-center gap-1">
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              icon={<Heading1 className="h-4 w-4" />}
              tooltip="Título 1"
              isActive={editor?.isActive("heading", { level: 1 })}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              icon={<Heading2 className="h-4 w-4" />}
              tooltip="Título 2"
              isActive={editor?.isActive("heading", { level: 2 })}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              icon={<Heading3 className="h-4 w-4" />}
              tooltip="Título 3"
              isActive={editor?.isActive("heading", { level: 3 })}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().setParagraph().run()}
              icon={<Pilcrow className="h-4 w-4" />}
              tooltip="Párrafo"
              isActive={editor?.isActive("paragraph")}
            />
            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleBold().run()}
              icon={<Bold className="h-4 w-4" />}
              tooltip="Negrita"
              isActive={editor?.isActive("bold")}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleItalic().run()}
              icon={<Italic className="h-4 w-4" />}
              tooltip="Cursiva"
              isActive={editor?.isActive("italic")}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleUnderline().run()}
              icon={<UnderlineIcon className="h-4 w-4" />}
              tooltip="Subrayado"
              isActive={editor?.isActive("underline")}
            />
            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleBulletList().run()}
              icon={<List className="h-4 w-4" />}
              tooltip="Lista con viñetas"
              isActive={editor?.isActive("bulletList")}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleOrderedList().run()}
              icon={<ListOrdered className="h-4 w-4" />}
              tooltip="Lista numerada"
              isActive={editor?.isActive("orderedList")}
            />
            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={addLink}
              icon={<LinkIcon className="h-4 w-4" />}
              tooltip="Insertar enlace"
              isActive={editor?.isActive("link")}
            />

            {/* Menú desplegable para tablas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 p-0 px-2 flex items-center gap-1 ${isInTable ? "bg-blue-50 text-blue-600" : ""}`}
                >
                  <TableIcon className="h-4 w-4" />
                  {isInTable && <span className="text-xs">Tabla</span>}
                  {isInTable && <ChevronDown className="h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {!isInTable ? (
                  <DropdownMenuItem onClick={addTable}>Insertar tabla</DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuLabel>Opciones de tabla</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <Tabs defaultValue="background">
                        <TabsList className="w-full">
                          <TabsTrigger value="background" className="flex-1 text-xs">
                            Fondo
                          </TabsTrigger>
                          <TabsTrigger value="text" className="flex-1 text-xs">
                            Texto
                          </TabsTrigger>
                          <TabsTrigger value="structure" className="flex-1 text-xs">
                            Estructura
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="background" className="mt-2">
                          <div className="grid grid-cols-5 gap-1">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.value}
                                className="w-8 h-8 rounded-sm border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                                onClick={() => setCellBackgroundColor(color.value)}
                              />
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs">Personalizado:</span>
                            <ColorPicker value="#ffffff" onChange={setCellBackgroundColor} />
                          </div>
                        </TabsContent>

                        <TabsContent value="text" className="mt-2">
                          <div className="grid grid-cols-5 gap-1">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.value}
                                className="w-8 h-8 rounded-sm border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                                onClick={() => setCellTextColor(color.value)}
                              />
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs">Personalizado:</span>
                            <ColorPicker value="#000000" onChange={setCellTextColor} />
                          </div>
                        </TabsContent>

                        <TabsContent value="structure" className="mt-2">
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().addColumnBefore().run()}
                            >
                              + Columna antes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().addColumnAfter().run()}
                            >
                              + Columna después
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().addRowBefore().run()}
                            >
                              + Fila antes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().addRowAfter().run()}
                            >
                              + Fila después
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().deleteColumn().run()}
                            >
                              - Columna
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => editor?.chain().focus().deleteRow().run()}
                            >
                              - Fila
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs h-8 w-full mt-1"
                            onClick={() => editor?.chain().focus().deleteTable().run()}
                          >
                            Eliminar tabla
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().setTextAlign("left").run()}
              icon={<AlignLeft className="h-4 w-4" />}
              tooltip="Alinear a la izquierda"
              isActive={editor?.isActive({ textAlign: "left" })}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().setTextAlign("center").run()}
              icon={<AlignCenter className="h-4 w-4" />}
              tooltip="Centrar"
              isActive={editor?.isActive({ textAlign: "center" })}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().setTextAlign("right").run()}
              icon={<AlignRight className="h-4 w-4" />}
              tooltip="Alinear a la derecha"
              isActive={editor?.isActive({ textAlign: "right" })}
            />

            {/* Menú desplegable para interlineado */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Interlineado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Interlineado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {lineHeightOptions.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setLineHeight(option.value)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleCodeBlock().run()}
              icon={<Code className="h-4 w-4" />}
              tooltip="Bloque de código"
              isActive={editor?.isActive("codeBlock")}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().toggleBlockquote().run()}
              icon={<Quote className="h-4 w-4" />}
              tooltip="Cita"
              isActive={editor?.isActive("blockquote")}
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().setHorizontalRule().run()}
              icon={<Minus className="h-4 w-4" />}
              tooltip="Línea horizontal"
            />
            <EditorButton
              onMouseDown={() => {
                if (editor?.isActive("image")) {
                  openImageConfigForSelected()
                } else {
                  fileInputRef.current?.click()
                }
              }}
              icon={<ImageIcon className="h-4 w-4" />}
              tooltip={editor?.isActive("image") ? "Configurar imagen" : "Insertar imagen"}
              isActive={editor?.isActive("image")}
            />
            <div className="w-px h-4 bg-border mx-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex">
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Palette className="h-4 w-4" />
                    </Button>
                    <ColorPicker value={editor?.getAttributes("textStyle").color || "#000000"} onChange={setColor} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Color del texto</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex">
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Highlighter className="h-4 w-4" />
                    </Button>
                    <ColorPicker
                      value={editor?.getAttributes("highlight").color || "#FFFF00"}
                      onChange={setHighlight}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resaltado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="w-px h-4 bg-border mx-1" />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().undo().run()}
              icon={<Undo className="h-4 w-4" />}
              tooltip="Deshacer"
            />
            <EditorButton
              onMouseDown={() => editor?.chain().focus().redo().run()}
              icon={<Redo className="h-4 w-4" />}
              tooltip="Rehacer"
            />
          </div>

          {/* Toggle para cambiar entre editor visual y HTML */}
          <div className="flex items-center gap-2">
            <Label htmlFor="html-mode" className="text-xs cursor-pointer">
              <div className="flex items-center gap-1">
                <FileCode className="h-4 w-4" />
                <span>Modo HTML</span>
              </div>
            </Label>
            <Switch
              id="html-mode"
              checked={showHtmlEditor}
              onCheckedChange={toggleHtmlEditor}
              aria-label="Cambiar a modo HTML"
            />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              openImageDialog(file)
            }
          }}
          accept="image/*"
        />

        <style jsx global>{`
          .ProseMirror {
            > * + * {
              margin-top: 0.75em;
            }
            ul, ol {
              padding: 0 1rem;
            }
            ul {
              list-style-type: disc;
            }
            ol {
              list-style-type: decimal;
            }
            h1 {
              font-size: 2em;
              font-weight: bold;
            }
            h2 {
              font-size: 1.5em;
              font-weight: bold;
            }
            h3 {
              font-size: 1.17em;
              font-weight: bold;
            }
            blockquote {
              border-left: 3px solid #b4b4b4;
              padding-left: 1rem;
              font-style: italic;
            }
            img {
              max-width: 100%;
              height: auto;
              cursor: pointer;
              transition: opacity 0.2s;
            }
            
            a img {
              border: 2px solid transparent;
              border-radius: 4px;
              pointer-events: none; /* Desactiva clics en modo edición */
            }
            
            a img:hover {
              border-color: #3b82f6;
              opacity: 0.9;
            }
            
            /* Indicador visual para imágenes con enlace */
            a[href]::after {
              content: "🔗";
              position: absolute;
              top: 4px;
              right: 4px;
              background: rgba(59, 130, 246, 0.8);
              color: white;
              padding: 2px 4px;
              border-radius: 2px;
              font-size: 10px;
              pointer-events: none;
              z-index: 10;
            }
            pre {
              background-color: #f4f4f4;
              border-radius: 3px;
              padding: 0.75rem;
              font-family: monospace;
            }
            code {
              background-color: #f4f4f4;
              padding: 0.2rem 0.4rem;
              border-radius: 3px;
              font-family: monospace;
            }
            table {
              border-collapse: collapse;
              margin: 0;
              overflow: hidden;
              table-layout: fixed;
              width: 100%;

              td, th {
                border: 1px solid #ced4daaa;
                box-sizing: border-box;
                min-width: 1em;
                padding: 3px 5px;
                position: relative;
                vertical-align: top;
                
                /* Asegurarse de que los colores de fondo y texto se apliquen correctamente */
                background-clip: padding-box;
                transition: background-color 0.2s, color 0.2s;

                > * {
                  margin-bottom: 0;
                }
              }

              th {
                background-color: #f1f3f522;
                font-weight: bold;
                text-align: left;
              }
            }
          }
          .editor-button-active {
            background-color: rgba(0, 0, 0, 0.1);
          }
          
          /* Estilos para el editor de HTML */
          .html-editor {
            position: relative;
            min-height: 300px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            tab-size: 2;
          }
          
          .html-editor textarea {
            width: 100%;
            min-height: 300px;
            padding: 16px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            tab-size: 2;
            color: #333;
            background-color: #f8f9fa;
            border: none;
            resize: vertical;
            outline: none;
          }
        `}</style>

        {showHtmlEditor ? (
          <div className="relative">
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
              <span className="text-xs font-medium text-gray-500">Editor HTML</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={formatHtmlCode}
                  className="text-xs h-7 px-2"
                  id="format-html-button"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Formatear HTML
                </Button>
              </div>
            </div>

            <div className="html-editor">
              <textarea
                ref={htmlTextareaRef}
                defaultValue={formatHTML(htmlContent)}
                onChange={(e) => setHtmlContent(e.target.value)}
                spellCheck="false"
                className="code-editor"
              />
            </div>
          </div>
        ) : (
          <div>
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Diálogo de configuración de imagen */}
        {isImageDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-semibold mb-4">
                {imageDialogData.file ? "Configurar nueva imagen" : "Configurar imagen"}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-width" className="text-sm font-medium">
                    Ancho (px, %, o auto)
                  </Label>
                  <input
                    id="image-width"
                    type="text"
                    placeholder="ej: 300px, 50%, auto"
                    value={imageDialogData.width || ""}
                    onChange={(e) => setImageDialogData((prev) => ({ ...prev, width: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="image-link" className="text-sm font-medium">
                    Enlace (opcional)
                  </Label>
                  <input
                    id="image-link"
                    type="url"
                    placeholder="https://ejemplo.com"
                    value={imageDialogData.href || ""}
                    onChange={(e) => setImageDialogData((prev) => ({ ...prev, href: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImageDialogOpen(false)
                    setImageDialogData({})
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={imageDialogData.file ? handleImageUpload : updateSelectedImage}>
                  {imageDialogData.file ? "Subir imagen" : "Actualizar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {charCount} / {MAX_CONTENT_LENGTH} caracteres
      </div>
    </div>
  )
}
