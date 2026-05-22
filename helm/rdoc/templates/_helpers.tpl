{{/*
Expand the name of the chart.
*/}}
{{- define "rdoc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fullname: <release>-<chartname>, capped at 63 chars.
*/}}
{{- define "rdoc.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Chart-Label (chart-version, sanitized).
*/}}
{{- define "rdoc.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels (gilt für alle Ressourcen).
Aufruf: {{ include "rdoc.labels" . }}
*/}}
{{- define "rdoc.labels" -}}
helm.sh/chart: {{ include "rdoc.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: {{ include "rdoc.name" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end -}}

{{/*
Komponenten-Name: <fullname>-<component> (z.B. raumdock-web).
Aufruf: {{ include "rdoc.componentName" (dict "root" . "component" "web") }}
*/}}
{{- define "rdoc.componentName" -}}
{{- printf "%s-%s" (include "rdoc.fullname" .root) .component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Labels für eine einzelne Komponente (inkl. component-Label).
*/}}
{{- define "rdoc.componentLabels" -}}
{{ include "rdoc.labels" .root }}
app.kubernetes.io/name: {{ printf "%s-%s" (include "rdoc.name" .root) .component }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{/*
Selector-Labels für eine Komponente (stabile Subset – darf sich nicht ändern).
*/}}
{{- define "rdoc.componentSelectorLabels" -}}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/name: {{ printf "%s-%s" (include "rdoc.name" .root) .component }}
{{- end -}}

{{/*
Voller Image-Pfad: <registry>/<repository>:<tag>. Tag fällt auf image.tag zurück, wenn leer.
Aufruf: {{ include "rdoc.image" (dict "root" . "repository" "rdoc-web" "tag" .Values.web.image.tag) }}
*/}}
{{- define "rdoc.image" -}}
{{- $tag := default .root.Values.image.tag .tag -}}
{{- printf "%s/%s:%s" .root.Values.image.registry .repository $tag -}}
{{- end -}}

{{/*
Secret-Name. Entweder das vom Chart erzeugte oder ein extern referenziertes.
*/}}
{{- define "rdoc.secretName" -}}
{{- if .Values.secrets.existingSecret -}}
{{- .Values.secrets.existingSecret -}}
{{- else -}}
{{- printf "%s-api" (include "rdoc.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
ConfigMap-Name.
*/}}
{{- define "rdoc.configMapName" -}}
{{- printf "%s-api" (include "rdoc.fullname" .) -}}
{{- end -}}
