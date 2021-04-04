# SEQUENCE
*необходимо знать:* [[Объекты Баз Данных mini-base]]
*теги:* #sql #базы_данных
*описание:* Последовательности уникальгных значений. Sequence не завясят от таблиц и сессий. Они позволяют генерировать уникальные значения.

---
## Шаблон
>CREATE SEQUENCE `schema.`sequence_name
>`INCREMENT BY number
>START WITCH number
>{MAXVALUE number | NOMAXVALUE}
>{MINVALUE number | NOMINVALUE}
>{CYCLE | NOCYCLE}
>{CACHE number | NOCACHE}`;

`INCREMENT BY` - показывает, насколько следующее число отличается от предыдущего.
increment by 3: 1,4,7,10...
increment by -3: 1,-2,-5...

`START WITCH` - с чего начинается последовательность.
`MAXVALUE CYCLE` - цикл. Когда последовательность доходит до указанного maxvalue, то последновательность начинает отсчет по новому кругу, начиная с 1 или с start witch
`NOMAVALUE/NOMINVALUE` - по умолчанию.
`nocycle` - по умолчанию
`MAXVALUE` - когда oracle дойдет до максимума, он будет выдавать ошибки.
`CACHE` - по умолчанию равен 20. Это означает, что изначально создается последовательность из 20 значений, а когда потребуется 21, то будет сгенерировано еще 20 значений.

## Работа с SEQUENCE	
Для вызова значений из sequence нужно использовать `NEXTVAL`(следующее значений, уникально для всех сессий) И `CURRVAL` (текущее значение в текущей сессии). Чтобы использовать curval, необходимо хотя бы раз вызвать nextval. 

В разных сессиях всегда уникальные значения.

```SQL
CREATE sequence S1;
select S1.NEXTVAL from DUAL;
select S1.CURRVAL from DUAL;

create sequence seq_faculty start with 20 increment by 5;
```

При работе с sequence часто будут возникать дыры, то есть будут пропущены некоторые значения. Чтобы этого не было, можно поступить следующим образом:

## Изменение SEQUENCE
>ALTER SEQUENCE `schema.`sequence_name
>`INCREMENT BY number
>{MAXVALUE number | NOMAXVALUE}
>{MINVALUE number | NOMINVALUE}
>{CYCLE | NOCYCLE}
>{CACHE number | NOCACHE}`;

## Удаление SEQUENCE
>DROP SEQUENCE `schema.`sequence_name;