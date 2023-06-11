import type { ZodType } from 'zod'
import { v4 as uuid } from 'uuid'

export const clx = (obj: Record<string, boolean | undefined | null>, cls: string) => {
  return [cls].concat(Object.keys(obj).filter(k => obj[k])).join(' ')
}

const debug = false;

export function getFromData<T extends Record<string, any>>(schema: ZodType<T>, event: React.FormEvent<Element>) {
  event.preventDefault()
  
  const inputs = Array.from(event.target as never)
      .filter(x => 
        typeof x === 'object' && x != null && "name" in x && x.name
      ) as HTMLInputElement[]
    
  const form = inputs.reduce<Record<string, string>>((byName, x) => ({
    ...byName,
    [x.name]: x.name === 'createdAt' ? new Date().toISOString(): x.name === 'id' ? uuid() : x.value
  }), {})

  let data: T | null = null
  const isOk = schema.safeParse(form)
  
  if (isOk) {
    data = schema.parse(form)
  }

  return {
    error: data == null,
    data,
    reset: () => inputs.forEach(input => {
      input.value = ''
    })
  }
}

export const Form = <T extends Record<string, any>,>({ title, className, schema, onSubmit, isLoading }: { title?: string, isLoading?: boolean, className?: string, schema: ZodType<T>, onSubmit?: (payload: T) => Promise<void> }) => {
  // eslint-disable-next-line
  // @ts-ignore
  // eslint-disable-next-line
  const shape = schema._def.shape() as Record<string, {_def: {typeName: 'ZodString' | 'ZodNumber' | 'ZodOptional'}}>
  // console.log(shape)

  const _onSubmit: React.FormEventHandler = (e) => {
    const { data, reset } = getFromData(schema, e)
    if (data) {
      if (typeof onSubmit === 'function')
        // eslint-disable-next-line
        onSubmit(data).then(() => reset()).catch()
      else
        console.log('mocked', 'onSubmit', data)
    }
  }

  // eslint-disable-next-line
  const fields = Object.keys(shape) as Array<keyof typeof shape>

  const inputTypes = {
    ZodString: "text",
    ZodDate: "datetime-local",
    ZodNumber: "number",
  }

  return <form onSubmit={_onSubmit} className={className || "flex flex-col gap-1"}>
    {title && <div className="text-2xl">{title}</div>}
    {fields.filter(k => shape[k]?._def.typeName!=='ZodOptional').map((k) => {
      let isHidden = false
      const _ztype = shape[k]?._def.typeName
      // eslint-disable-next-line
      // @ts-ignore
      // eslint-disable-next-line
      const inputtype = inputTypes[k] || inputTypes[_ztype] || 'text'
      let defaultValue = ''
      if (k === 'id') {
        defaultValue = uuid()
        isHidden = true
      }
      if (k === 'createdAt') {
        isHidden = true
      }

      return (
        <div key={k} className='flex flex-col'>
          <label className={clx({"hidden": isHidden}, "text-sm")}>{k}</label>
          {/* eslint-disable-next-line */}
          <input disabled={isLoading} type={inputtype} defaultValue={defaultValue} name={k} placeholder={k} className={clx({"hidden": isHidden}, "text-xl border px-4 py-2")} />
          {debug  && <pre className='text-gray-300'>
            {/* eslint-disable-next-line */}
            {/* @ts-ignore */}
            {JSON.stringify(shape[k]._def.typeName)}
            {/* eslint-disable-next-line */}
            {/* @ts-ignore */}
            {JSON.stringify(shape[k]._def)}
          </pre>}
        </div>
      )}
    )}
    <button disabled={isLoading} type="submit" className={clx({ 'disabled:bg-cyan-800': isLoading }, 'disabled:cursor-not-allowed bg-cyan-600 text-white py-2 text-md self-end px-4 rounded hover:bg-cyan-500 active:bg-cyan-400')}>
      {isLoading ? 'Creating...' : 'Create'}
    </button>
  </form>
}
